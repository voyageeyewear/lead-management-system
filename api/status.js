module.exports = (req, res) => {
  res.status(200).json({
    status: 'Lead Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health',
      'GET /api/status', 
      'POST /api/auth/login',
      'GET /api/admin/reports',
      'GET /api/user/leads'
    ]
  });
};
