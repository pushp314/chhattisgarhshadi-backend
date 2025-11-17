import { Router } from 'express';
import { privacyController } from '../controllers/privacy.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { 
  upsertProfilePrivacySchema,
  upsertCommunicationSettingsSchema, 
  upsertSearchVisibilitySchema,
  upsertAccountSecuritySchema, // ADDED
} from '../validation/privacy.validation.js';

const router = Router();

// All privacy routes require authentication
router.use(authenticate);


router
  .route('/profile')
  .get(privacyController.getMyProfilePrivacy)
  .put(
    validate(upsertProfilePrivacySchema),
    privacyController.updateMyProfilePrivacy
  );

router
  .route('/communication')
  .get(privacyController.getMyCommunicationSettings)
  .put(
    validate(upsertCommunicationSettingsSchema),
    privacyController.updateMyCommunicationSettings
  );


router
  .route('/search')
  .get(privacyController.getMySearchVisibilitySettings)
  .put(
    validate(upsertSearchVisibilitySchema),
    privacyController.updateMySearchVisibilitySettings
  );


router
  .route('/security')
  .get(privacyController.getMyAccountSecuritySettings)
  .put(
    validate(upsertAccountSecuritySchema),
    privacyController.updateMyAccountSecuritySettings
  );

export default router;