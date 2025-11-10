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

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;