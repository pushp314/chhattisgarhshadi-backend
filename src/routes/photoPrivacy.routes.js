import { Router } from 'express';
import { photoPrivacyController } from '../controllers/photoPrivacy.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { 
  updatePhotoPrivacySchema 
} from '../validation/photoPrivacy.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);


router
  .route('/:mediaId/privacy')
  .get(
    validate(updatePhotoPrivacySchema.pick({ params: true })), // Only validate params
    photoPrivacyController.getMyPhotoSettings
  )
  .put(
    validate(updatePhotoPrivacySchema),
    photoPrivacyController.updateMyPhotoSettings
  );

export default router;