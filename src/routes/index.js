import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import profileRoutes from './profile.routes.js';
import matchRoutes from './match.routes.js';
import messageRoutes from './message.routes.js';
import paymentRoutes from './payment.routes.js';
import uploadRoutes from './upload.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Mount all routes
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profiles', profileRoutes);
router.use('/matches', matchRoutes);
router.use('/messages', messageRoutes);
router.use('/payments', paymentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

/**
 * 404 handler for undefined routes
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

export default router;
