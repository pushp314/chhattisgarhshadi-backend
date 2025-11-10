const express = require('express');
const router = express.Router();

// Auth routes
const authRoutes = require('./auth.routes');
router.use('/auth', authRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;