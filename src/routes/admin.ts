import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { query } from '../db/client';
import { requireAuth, requireRole } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth, requireRole('admin'));

// CSV Upload: expects columns like first_name,last_name,email,phone,source
router.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file || !req.user) return res.status(400).json({ error: 'File required' });

  const csv = req.file.buffer.toString('utf-8');
  const records: any[] = [];
  await new Promise<void>((resolve, reject) => {
    parse(csv, { columns: true, skip_empty_lines: true, trim: true })
      .on('readable', function (this: any) {
        let record;
        // eslint-disable-next-line no-cond-assign
        while ((record = this.read())) records.push(record);
      })
      .on('error', reject)
      .on('end', () => resolve());
  });

  const values: any[] = [];
  const placeholders: string[] = [];
  let i = 1;
  for (const r of records) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(
      req.user.orgId,
      r.first_name || null,
      r.last_name || null,
      r.email || null,
      r.phone || null,
      r.source || null
    );
  }

  if (values.length === 0) return res.json({ inserted: 0 });

  const sql = `INSERT INTO leads(org_id, first_name, last_name, email, phone, source)
               VALUES ${placeholders.join(',')}`;
  await query(sql, values);
  res.json({ inserted: records.length });
});

// Assign leads to a user
router.post('/assign', async (req, res) => {
  const { userId, leadIds } = req.body as { userId: string; leadIds: string[] };
  if (!userId || !Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: 'userId and leadIds required' });
  }
  await query(`UPDATE leads SET owner_user_id=$1, status='assigned', updated_at=now() WHERE id = ANY($2::uuid[])`, [
    userId,
    leadIds,
  ]);
  res.json({ updated: leadIds.length });
});

// User activity tracking summary
router.get('/activity-summary', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const orgId = req.user.orgId;
  const assigned = await query(
    `SELECT u.id as user_id, u.email,
            COUNT(l.*) as leads_assigned
     FROM users u
     LEFT JOIN leads l ON l.owner_user_id = u.id
     WHERE u.org_id=$1
     GROUP BY u.id, u.email
     ORDER BY u.email`,
    [orgId]
  );

  const followed = await query(
    `SELECT u.id as user_id, COUNT(a.*) as leads_followed
     FROM users u
     LEFT JOIN lead_activities a ON a.user_id = u.id AND a.type IN ('status_change','follow_up','follow_up_completed')
     WHERE u.org_id=$1
     GROUP BY u.id`,
    [orgId]
  );

  res.json({ assigned: assigned.rows, followed: followed.rows });
});

// Reports / analytics
router.get('/reports', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const orgId = req.user.orgId;
  const perUser = await query(
    `SELECT u.id as user_id, u.email,
            COUNT(l.*) FILTER (WHERE l.status='assigned') as assigned,
            COUNT(l.*) FILTER (WHERE l.status='converted') as converted,
            COUNT(l.*) as total
     FROM users u
     LEFT JOIN leads l ON l.owner_user_id = u.id
     WHERE u.org_id=$1
     GROUP BY u.id, u.email
     ORDER BY u.email`,
    [orgId]
  );

  // Simple time-to-contact: first status_change from untouched per lead
  const ttc = await query(
    `SELECT AVG(EXTRACT(EPOCH FROM (a.created_at - l.created_at))) as avg_seconds
     FROM leads l
     JOIN LATERAL (
       SELECT * FROM lead_activities a
       WHERE a.lead_id = l.id AND a.type='status_change' AND a.old_status='untouched'
       ORDER BY a.created_at ASC
       LIMIT 1
     ) a ON true
     WHERE l.org_id=$1`,
    [orgId]
  );

  res.json({ perUser: perUser.rows, avgTimeToContactSeconds: ttc.rows[0]?.avg_seconds || 0 });
});

export default router;
// Create user
router.post('/users', async (req, res) => {
  const { email, password, role } = req.body as { email: string; password: string; role: 'admin' | 'user' };
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password, role required' });
  const hash = await bcrypt.hash(password, 10);
  await query(`INSERT INTO users(org_id, email, password_hash, role) VALUES($1,$2,$3,$4)`, [
    req.user.orgId,
    email,
    hash,
    role,
  ]);
  res.json({ ok: true });
});


