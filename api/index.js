const serverless = require('serverless-http');
const express = require('express');

const app = express();
app.use(express.json());

// Environment variables
const env = {
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  vercelPostgresUrl: process.env.DATABASE_URL || '',
};

// Routes
app.get('/api/health', (_, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    env: {
      hasJwtSecret: !!env.jwtSecret,
      hasDbUrl: !!env.vercelPostgresUrl
    }
  });
});

app.get('/api/status', (_, res) => {
  res.json({ 
    status: 'Lead Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ 
    message: 'Login endpoint - DB connection will be implemented',
    body: req.body 
  });
});

app.get('/api/admin/reports', (req, res) => {
  res.json({ 
    message: 'Reports endpoint - DB connection will be implemented'
  });
});

app.get('/api/user/leads', (req, res) => {
  res.json({ 
    message: 'User leads endpoint - DB connection will be implemented'
  });
});

module.exports = serverless(app);
