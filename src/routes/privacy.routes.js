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

/**
 * @swagger
 * /api/v1/privacy/profile:
 * get:
 * summary: Get the user's profile privacy settings
 * tags: [Privacy Settings]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Profile privacy settings retrieved
 * put:
 * summary: Create or update the user's profile privacy settings
 * tags: [Privacy Settings]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpsertProfilePrivacy'
 * responses:
 * 200:
 * description: Profile privacy settings updated
 */
router
  .route('/profile')
  .get(privacyController.getMyProfilePrivacy)
  .put(
    validate(upsertProfilePrivacySchema),
    privacyController.updateMyProfilePrivacy
  );

/**
 * @swagger
 * /api/v1/privacy/communication:
 * get:
 * summary: Get the user's communication preferences
 * tags: [Privacy Settings]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Communication preferences retrieved
 * put:
 * summary: Create or update the user's communication preferences
 * tags: [Privacy Settings]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpsertCommunicationSettings'
 * responses:
 * 200:
 * description: Communication preferences updated
 */
router
  .route('/communication')
  .get(privacyController.getMyCommunicationSettings)
  .put(
    validate(upsertCommunicationSettingsSchema),
    privacyController.updateMyCommunicationSettings
  );

/**
 * @swagger
 * /api/v1/privacy/search:
 * get:
 * summary: Get the user's search visibility settings
 * tags: [Privacy Settings]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Search visibility settings retrieved
 * put:
 * summary: Create or update the user's search visibility settings
 * tags: [Privacy Settings]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpsertSearchVisibility'
 * responses:
 * 200:
 * description: Search visibility settings updated
 */
router
  .route('/search')
  .get(privacyController.getMySearchVisibilitySettings)
  .put(
    validate(upsertSearchVisibilitySchema),
    privacyController.updateMySearchVisibilitySettings
  );

/**
 * @swagger
 * /api/v1/privacy/security:
 * get:
 * summary: Get the user's account security settings
 * tags: [Privacy Settings]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Account security settings retrieved
 * put:
 * summary: Create or update the user's account security settings
 * tags: [Privacy Settings]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpsertAccountSecurity'
 * responses:
 * 200:
 * description: Account security settings updated
 */
router
  .route('/security')
  .get(privacyController.getMyAccountSecuritySettings)
  .put(
    validate(upsertAccountSecuritySchema),
    privacyController.updateMyAccountSecuritySettings
  );

export default router;