import serverless from 'serverless-http';
import express from 'express';
import dayjs from 'dayjs';
import { query } from '../../src/db/client';

const app = express();
app.get('/api/cron/automation', async (_req, res) => {
  // Find enrollments with next step due
  const due = await query<{
    enrollment_id: string;
    lead_id: string;
    sequence_id: string;
    last_executed_step: number;
    step_order: number;
    channel: string;
    template_id: string | null;
  }>(
    `SELECT ae.id as enrollment_id, ae.lead_id, ae.sequence_id, ae.last_executed_step,
            s.step_order, s.channel, s.template_id
     FROM automation_enrollments ae
     JOIN automation_sequence_steps s
       ON s.sequence_id = ae.sequence_id AND s.step_order = ae.last_executed_step + 1
     JOIN leads l ON l.id = ae.lead_id
     WHERE ae.completed = false
       AND now() >= ae.enrolled_at + (s.offset_days || ' days')::interval`
  );

  // Simulate sending; log outbound message and advance step
  for (const r of due.rows) {
    await query(
      `INSERT INTO outbound_messages(lead_id, channel, template_id, step_order, status, sent_at)
       VALUES($1,$2,$3,$4,'sent',now())`,
      [r.lead_id, r.channel, r.template_id, r.step_order]
    );
    const next = r.step_order;
    // Determine if there are more steps
    const remaining = await query<{ count: string }>(
      `SELECT COUNT(*) FROM automation_sequence_steps WHERE sequence_id=$1 AND step_order > $2`,
      [r.sequence_id, next]
    );
    const hasMore = Number(remaining.rows[0].count) > 0;
    await query(
      `UPDATE automation_enrollments SET last_executed_step=$1, completed=$2 WHERE id=$3`,
      [next, !hasMore, r.enrollment_id]
    );
  }

  res.json({ processed: due.rows.length, timestamp: dayjs().toISOString() });
});

export default serverless(app);


