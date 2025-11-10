import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/profiles
 * @desc    Create profile
 * @access  Private
 */
router.post('/', profileController.createProfile);

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
router.put('/me', profileController.updateMyProfile);

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
router.get('/search', requireCompleteProfile, profileController.searchProfiles);

/**
 * @route   POST /api/profiles/photos
 * @desc    Add photo to profile
 * @access  Private
 */
router.post('/photos', profileController.addPhoto);

/**
 * @route   DELETE /api/profiles/photos
 * @desc    Remove photo from profile
 * @access  Private
 */
router.delete('/photos', profileController.removePhoto);

/**
 * @route   GET /api/profiles/:userId
 * @desc    Get profile by user ID
 * @access  Private (requires complete profile)
 */
router.get('/:userId', requireCompleteProfile, profileController.getProfileByUserId);

export default router;
