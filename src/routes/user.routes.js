import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', userController.getMyProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user
 * @access  Private
 */
router.put('/me', userController.updateMe);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete current user account
 * @access  Private
 */
router.delete('/me', userController.deleteMe);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search', userController.searchUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', userController.getUserById);

export default router;
