import { Router } from 'express';
import multer from 'multer'; // ADDED
import { adminController } from '../controllers/admin.controller.js';
import { adminBulkController } from '../controllers/admin.bulk.controller.js'; // ADDED
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  paginationQuerySchema,
  recentQuerySchema,
  userIdParamSchema,
  updateUserRoleSchema,
  getReportsSchema,
  reportIdParamSchema,
  updateReportSchema,
} from '../validation/admin.validation.js';

// ADDED: Import new agent routes
import agentRoutes from './agent.routes.js';
// ADDED: Import verification routes
import verificationRoutes from './verification.routes.js';
// ADDED: Import analytics routes
import analyticsRoutes from './analytics.routes.js';
// ADDED: Import activity log routes
import activityLogRoutes from './activityLog.routes.js';
// ADDED: Import audit log routes
import auditLogRoutes from './auditLog.routes.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // ADDED: Memory storage for Excel


// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// --- User Management ---
router.get(
  '/users',
  validate(paginationQuerySchema),
  adminController.getAllUsers
);

// ADDED: Bulk User Upload
router.post(
  '/users/bulk-upload',
  upload.single('file'),
  adminBulkController.uploadUsers
);

router.get(
  '/users/recent',
  validate(recentQuerySchema),
  adminController.getRecentUsers
);
router.get(
  '/users/:userId',
  validate(userIdParamSchema),
  adminController.getUserById
);
router.put(
  '/users/:userId/role',
  validate(updateUserRoleSchema),
  adminController.updateUserRole
);
router.delete(
  '/users/:userId',
  validate(userIdParamSchema),
  adminController.deleteUser
);

// --- Profile Management ---
router.get(
  '/profiles',
  validate(paginationQuerySchema),
  adminController.getAllProfiles
);

// --- Match Management ---
router.get(
  '/matches/recent',
  validate(recentQuerySchema),
  adminController.getRecentMatches
);

// --- Dashboard & System ---
router.get('/stats', adminController.getDashboardStats);
router.post('/cleanup/tokens', adminController.cleanupExpiredTokens);

// --- Report Management ---
router.get(
  '/reports',
  validate(getReportsSchema),
  adminController.getReports
);
router.get(
  '/reports/:id',
  validate(reportIdParamSchema),
  adminController.getReportById
);
router.put(
  '/reports/:id',
  validate(updateReportSchema),
  adminController.updateReport
);

// --- ADDED: Agent Management ---
// All routes in agentRoutes will be prefixed with /admin/agents
// and will be protected by the requireAdmin middleware
router.use('/agents', agentRoutes);

// --- ADDED: Verification Management ---
// All routes will be prefixed with /admin/verifications
router.use('/verifications', verificationRoutes);

// --- ADDED: Analytics ---
// All routes will be prefixed with /admin/analytics
router.use('/analytics', analyticsRoutes);

// --- SUBSCRIPTION PLAN MANAGEMENT ---
router.get('/plans', adminController.getPlans);
router.put('/plans/:planId', adminController.updatePlan); // ADDED: Update plan details
router.patch('/plans/:planId/discount', adminController.updatePlanDiscount);

// --- ADDED: Activity Logs ---
// All routes will be prefixed with /admin/activity-logs
router.use('/activity-logs', activityLogRoutes);

// --- ADDED: Audit Logs ---
// All routes will be prefixed with /admin/audit-logs
router.use('/audit-logs', auditLogRoutes);

export default router;