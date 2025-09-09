import { Router } from 'express';
import { query } from '../db/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('user'));

// View assigned leads
router.get('/leads', async (req, res) => {
  const userId = req.user!.userId;
  const leads = await query(
    `SELECT l.* FROM leads l WHERE l.owner_user_id=$1 ORDER BY l.updated_at DESC`,
    [userId]
  );
  res.json(leads.rows);
});

// Update lead status
router.post('/leads/:id/status', async (req, res) => {
  const userId = req.user!.userId;
  const leadId = req.params.id;
  const { status } = req.body as { status: string };
  const leadRes = await query<{ status: string }>(`SELECT status FROM leads WHERE id=$1 AND owner_user_id=$2`, [
    leadId,
    userId,
  ]);
  const lead = leadRes.rows[0];
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  await query(`UPDATE leads SET status=$1, updated_at=now() WHERE id=$2`, [status, leadId]);
  await query(
    `INSERT INTO lead_activities(lead_id, user_id, type, old_status, new_status) VALUES($1,$2,'status_change',$3,$4)`,
    [leadId, userId, lead.status, status]
  );
  res.json({ ok: true });
});

// Add note
router.post('/leads/:id/notes', async (req, res) => {
  const userId = req.user!.userId;
  const leadId = req.params.id;
  const { note } = req.body as { note: string };
  await query(
    `INSERT INTO lead_activities(lead_id, user_id, type, note) VALUES($1,$2,'note',$3)`,
    [leadId, userId, note]
  );
  res.json({ ok: true });
});

// Follow-up create/complete
router.post('/leads/:id/follow-ups', async (req, res) => {
  const userId = req.user!.userId;
  const leadId = req.params.id;
  const { followUpAt } = req.body as { followUpAt: string };
  await query(
    `INSERT INTO lead_activities(lead_id, user_id, type, follow_up_at) VALUES($1,$2,'follow_up',$3)`,
    [leadId, userId, followUpAt]
  );
  res.json({ ok: true });
});

router.post('/leads/:id/follow-ups/:activityId/complete', async (req, res) => {
  const userId = req.user!.userId;
  const leadId = req.params.id;
  const activityId = req.params.activityId;
  await query(
    `INSERT INTO lead_activities(lead_id, user_id, type, note) VALUES($1,$2,'follow_up_completed',$3)`,
    [leadId, userId, `Completed activity ${activityId}`]
  );
  res.json({ ok: true });
});

export default router;


