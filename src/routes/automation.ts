import { Router } from 'express';
import { query } from '../db/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// Create template
router.post('/templates', async (req, res) => {
  const { channel, name, subject, body } = req.body as any;
  const orgId = req.user!.orgId;
  const r = await query(
    `INSERT INTO message_templates(org_id, channel, name, subject, body)
     VALUES($1,$2,$3,$4,$5) RETURNING id`,
    [orgId, channel, name, subject || null, body]
  );
  res.json({ id: r.rows[0].id });
});

// Create sequence and steps
router.post('/sequences', async (req, res) => {
  const orgId = req.user!.orgId;
  const { name, steps } = req.body as { name: string; steps: Array<{ offset_days: number; channel: string; template_id: string }>; };
  const seq = await query<{ id: string }>(
    `INSERT INTO automation_sequences(org_id, name) VALUES($1,$2) RETURNING id`,
    [orgId, name]
  );
  const seqId = seq.rows[0].id;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    await query(
      `INSERT INTO automation_sequence_steps(sequence_id, step_order, offset_days, channel, template_id)
       VALUES($1,$2,$3,$4,$5)`,
      [seqId, i + 1, s.offset_days, s.channel, s.template_id]
    );
  }
  res.json({ id: seqId });
});

// Enroll lead into a sequence
router.post('/enroll', async (req, res) => {
  const { leadId, sequenceId } = req.body as { leadId: string; sequenceId: string };
  await query(
    `INSERT INTO automation_enrollments(lead_id, sequence_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
    [leadId, sequenceId]
  );
  res.json({ ok: true });
});

export default router;


