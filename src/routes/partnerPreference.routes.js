import { Router } from 'express';
import { partnerPreferenceController } from '../controllers/partnerPreference.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { upsertPreferenceSchema } from '../validation/partnerPreference.validation.js';

const router = Router();

// All preference routes require authentication and an active profile
router.use(authenticate, requireCompleteProfile);

router
  .route('/')
  .get(partnerPreferenceController.getMyPreference)
  .put(
    validate(upsertPreferenceSchema),
    partnerPreferenceController.upsertMyPreference
  );

export default router;