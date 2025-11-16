import { Router } from 'express';
import { partnerPreferenceController } from '../controllers/partnerPreference.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { upsertPreferenceSchema } from '../validation/partnerPreference.validation.js';

const router = Router();

// All preference routes require authentication and an active profile
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/preference:
 * get:
 * summary: Get the user's partner preferences
 * tags: [Partner Preference]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Partner preferences retrieved
 * put:
 * summary: Create or update the user's partner preferences
 * tags: [Partner Preference]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpsertPreference'
 * responses:
 * 200:
 * description: Partner preferences updated
 */
router
  .route('/')
  .get(partnerPreferenceController.getMyPreference)
  .put(
    validate(upsertPreferenceSchema),
    partnerPreferenceController.upsertMyPreference
  );

export default router;