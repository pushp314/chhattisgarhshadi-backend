import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';  // ✅ Changed isAdmin → requireAdmin

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);  // ✅ Changed isAdmin → requireAdmin

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/recent
 * @desc    Get recent users
 * @access  Admin
 */
router.get('/users/recent', adminController.getRecentUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/users/:userId', adminController.getUserById);

/**
 * @route   PUT /api/admin/users/:userId/role
 * @desc    Update user role
 * @access  Admin
 */
router.put('/users/:userId/role', adminController.updateUserRole);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/users/:userId', adminController.deleteUser);

/**
 * @route   GET /api/admin/profiles
 * @desc    Get all profiles
 * @access  Admin
 */
router.get('/profiles', adminController.getAllProfiles);

/**
 * @route   GET /api/admin/matches/recent
 * @desc    Get recent matches
 * @access  Admin
 */
router.get('/matches/recent', adminController.getRecentMatches);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @route   POST /api/admin/cleanup/tokens
 * @desc    Clean up expired tokens
 * @access  Admin
 */
router.post('/cleanup/tokens', adminController.cleanupExpiredTokens);

export default router;