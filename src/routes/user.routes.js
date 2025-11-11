import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  objectIdSchema,
  updateMeSchema,
  searchUsersSchema,
} from '../validation/user.validation.js';

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
 * @desc    Update current user's non-critical data
 * @access  Private
 */
router.put('/me', validate(updateMeSchema), userController.updateMe);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete current user account (Soft Delete)
 * @access  Private
 */
router.delete('/me', userController.deleteMe);

/**
 * @route   GET /api/users/search
 * @desc    Search other users (public, paginated)
 * @access  Private
 */
router.get('/search', validate(searchUsersSchema), userController.searchUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get another user's public profile by ID
 * @access  Private
 */
router.get('/:id', validate(objectIdSchema), userController.getUserById);

export default router;