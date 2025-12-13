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
// ADDED: Import cache middleware for performance
import { cacheProfile, cacheMiddleware } from '../middleware/cache.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);


router.post('/', validate(createProfileSchema), profileController.createProfile);


router.get('/me', profileController.getMyProfile);
router.put('/me', validate(updateProfileSchema), profileController.updateMyProfile);
router.delete('/me', profileController.deleteMyProfile);


// Search profiles - cached for 5 minutes
router.get(
  '/search',
  requireCompleteProfile,
  validate(searchProfilesSchema),
  cacheMiddleware({ prefix: 'search:', ttl: 300 }),
  profileController.searchProfiles
);

router.delete(
  '/photos/:mediaId',
  validate(mediaIdSchema),
  profileController.deletePhoto
);

// Get Recommendations (Smart Algorithm)
router.get(
  '/recommendations',
  requireCompleteProfile,
  profileController.getRecommendations
);

// Get public profile by userId - cached for 5 minutes
router.get(
  '/:userId',
  requireCompleteProfile,
  validate(objectIdSchema),
  cacheProfile,
  profileController.getProfileByUserId
);

export default router;