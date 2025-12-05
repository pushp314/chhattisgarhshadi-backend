import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All analytics routes require admin auth
router.use(authenticate, requireAdmin);

// GET /admin/analytics/revenue - Monthly revenue data
router.get('/revenue', analyticsController.getRevenueAnalytics);

// GET /admin/analytics/signups - Signups by district
router.get('/signups', analyticsController.getSignupsByDistrict);

// GET /admin/analytics/subscriptions - Subscription breakdown
router.get('/subscriptions', analyticsController.getSubscriptionAnalytics);

export default router;
