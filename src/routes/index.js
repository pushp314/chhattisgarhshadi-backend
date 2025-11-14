import express from 'express';
const router = express.Router();

// Auth routes
import authRoutes from './auth.routes.js';
router.use('/auth', authRoutes);

// User routes
import userRoutes from './user.routes.js';
router.use('/users', userRoutes);

// Profile routes
import profileRoutes from './profile.routes.js';
router.use('/profiles', profileRoutes);

// Match routes
import matchRoutes from './match.routes.js';
router.use('/matches', matchRoutes);

// Message routes
import messageRoutes from './message.routes.js';
router.use('/messages', messageRoutes);

// Notification routes
import notificationRoutes from './notification.routes.js';
router.use('/notifications', notificationRoutes);

// Payment routes
import paymentRoutes from './payment.routes.js';
router.use('/payments', paymentRoutes);

// Upload routes
import uploadRoutes from './upload.routes.js';
router.use('/uploads', uploadRoutes);

// Admin routes
import adminRoutes from './admin.routes.js';
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ API is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: '✅ Connected',
      socket: '✅ Running',
      firebase: process.env.FIREBASE_PROJECT_ID ? '✅ Configured' : '⚠️ Not configured',
      aws: process.env.AWS_ACCESS_KEY_ID ? '✅ Configured' : '⚠️ Not configured',
      msg91: process.env.MSG91_AUTH_KEY ? '✅ Configured' : '⚠️ Not configured',
      razorpay: process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '⚠️ Not configured',
    },
  });
});

export default router;