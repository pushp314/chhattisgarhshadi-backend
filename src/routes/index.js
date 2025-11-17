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

// Education routes
import educationRoutes from './education.routes.js';
router.use('/education', educationRoutes);

// Occupation routes
import occupationRoutes from './occupation.routes.js';
router.use('/occupation', occupationRoutes);

// Partner Preference routes
import partnerPreferenceRoutes from './partnerPreference.routes.js';
router.use('/preference', partnerPreferenceRoutes);

// Shortlist routes
import shortlistRoutes from './shortlist.routes.js';
router.use('/shortlist', shortlistRoutes);

// Block routes
import blockRoutes from './block.routes.js';
router.use('/block', blockRoutes);

// Report routes
import reportRoutes from './report.routes.js';
router.use('/report', reportRoutes);

// ADDED: Profile View routes
import profileViewRoutes from './profileView.routes.js';
router.use('/view', profileViewRoutes); // Using /view as the prefix

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

// Health check endpoint with detailed status
import prisma from '../config/database.js';

router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    res.json({
      success: true,
      status: 'healthy',
      message: '✅ API is healthy and running',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: {
          status: '✅ Connected',
          latency: `${dbLatency}ms`,
          type: 'PostgreSQL (Neon)',
        },
        socket: {
          status: '✅ Running',
          service: 'Socket.io',
        },
        firebase: {
          status: process.env.FIREBASE_PROJECT_ID ? '✅ Configured' : '⚠️ Not configured',
          service: 'FCM Push Notifications',
        },
        aws: {
          status: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your-aws-access-key-id' 
            ? '✅ Configured' 
            : '⚠️ Not configured',
          service: 'S3 File Storage',
        },
        msg91: {
          status: process.env.MSG91_AUTH_KEY && process.env.MSG91_AUTH_KEY !== 'your-msg91-auth-key'
            ? '✅ Configured' 
            : '⚠️ Not configured',
          service: 'SMS OTP',
        },
        razorpay: {
          status: process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '⚠️ Not configured',
          service: 'Payment Gateway',
        },
      },
      memory: {
        usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: '❌ Service degraded',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;