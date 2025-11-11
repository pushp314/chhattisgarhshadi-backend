import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createProfileSchema,
  updateProfileSchema,
  searchProfilesSchema,
  objectIdSchema,
  mediaIdSchema
} from '../validation/profile.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/profiles
 * @desc    Create profile
 * @access  Private
 */
router.post('/', validate(createProfileSchema), profileController.createProfile);

/**
 * @route   GET /api/profiles/me
 * @desc    Get my profile
 * @access  Private
 */
router.get('/me', profileController.getMyProfile);

/**
 * @route   PUT /api/profiles/me
 * @desc    Update my profile
 * @access  Private
 */
router.put('/me', validate(updateProfileSchema), profileController.updateMyProfile);

/**
 * @route   DELETE /api/profiles/me
 * @desc    Delete my profile
 * @access  Private
 */
router.delete('/me', profileController.deleteMyProfile);

/**
 * @route   GET /api/profiles/search
 * @desc    Search profiles
 * @access  Private (requires complete profile)
 */
router.get(
  '/search',
  requireCompleteProfile,
  validate(searchProfilesSchema),
  profileController.searchProfiles
);

/**
 * @route   DELETE /api/profiles/photos/:mediaId
 * @desc    Remove a photo from my profile
 * @access  Private
 */
router.delete(
  '/photos/:mediaId',
  validate(mediaIdSchema),
  profileController.deletePhoto
);

/**
 * @route   GET /api/profiles/:userId
 * @desc    Get profile by user ID
 * @access  Private (requires complete profile)
 */
router.get(
  '/:userId',
  requireCompleteProfile,
  validate(objectIdSchema),
  profileController.getProfileByUserId
);

export default router;