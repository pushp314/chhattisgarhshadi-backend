import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
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

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// --- User Management ---
router.get(
  '/users',
  validate(paginationQuerySchema),
  adminController.getAllUsers
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

export default router;