const serverless = require('serverless-http');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { parse } = require('csv-parse');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Environment variables
const env = {
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  vercelPostgresUrl: process.env.DATABASE_URL || '',
};

// Database client
let pool = null;
function getPool() {
  if (!pool) {
    pool = new Pool({ 
      connectionString: env.vercelPostgresUrl, 
      ssl: { rejectUnauthorized: false } 
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

// JWT utilities
function signJwt(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

function verifyJwt(token) {
  return jwt.verify(token, env.jwtSecret);
}

// Auth middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyJwt(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role && !(role === 'user' && req.user.role === 'admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Routes
app.get('/api/health', (_, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const result = await query(
      `SELECT id, org_id, password_hash, role FROM users WHERE email=$1`,
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = signJwt({ userId: user.id, role: user.role, orgId: user.org_id });
    res.json({ token, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/admin/upload-csv', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.user) return res.status(400).json({ error: 'File required' });

    const csv = req.file.buffer.toString('utf-8');
    const records = [];
    
    await new Promise((resolve, reject) => {
      parse(csv, { columns: true, skip_empty_lines: true, trim: true })
        .on('readable', function() {
          let record;
          while ((record = this.read())) records.push(record);
        })
        .on('error', reject)
        .on('end', () => resolve());
    });

    if (records.length === 0) return res.json({ inserted: 0 });

    const values = [];
    const placeholders = [];
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

    const sql = `INSERT INTO leads(org_id, first_name, last_name, email, phone, source)
                 VALUES ${placeholders.join(',')}`;
    await query(sql, values);
    res.json({ inserted: records.length });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/reports', requireAuth, requireRole('admin'), async (req, res) => {
  try {
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
    res.json({ perUser: perUser.rows });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
app.get('/api/user/leads', requireAuth, requireRole('user'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const leads = await query(
      `SELECT l.* FROM leads l WHERE l.owner_user_id=$1 ORDER BY l.updated_at DESC`,
      [userId]
    );
    res.json(leads.rows);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = serverless(app);
