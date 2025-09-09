module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    env: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDbUrl: !!process.env.DATABASE_URL
    }
  });
};
