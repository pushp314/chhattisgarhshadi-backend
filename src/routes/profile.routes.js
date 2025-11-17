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


router.post('/', validate(createProfileSchema), profileController.createProfile);


router.get('/me', profileController.getMyProfile);
router.put('/me', validate(updateProfileSchema), profileController.updateMyProfile);
router.delete('/me', profileController.deleteMyProfile);


router.get(
  '/search',
  requireCompleteProfile,
  validate(searchProfilesSchema),
  profileController.searchProfiles
);

router.delete(
  '/photos/:mediaId',
  validate(mediaIdSchema),
  profileController.deletePhoto
);

router.get(
  '/:userId',
  requireCompleteProfile,
  validate(objectIdSchema),
  profileController.getProfileByUserId
);

export default router;