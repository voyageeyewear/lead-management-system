import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/client';
import { signJwt } from '../auth/jwt';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const result = await query<{ id: string; org_id: string; password_hash: string; role: 'admin' | 'user' }>(
    `SELECT id, org_id, password_hash, role FROM users WHERE email=$1`,
    [email]
  );
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signJwt({ userId: user.id, role: user.role, orgId: user.org_id });
  res.json({ token, role: user.role });
});

export default router;


