import { Router } from 'express';
import { notificationSettingsController } from '../controllers/notificationSettings.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { upsertNotificationSettingsSchema } from '../validation/notificationSettings.validation.js';

const router = Router();

// All notification settings routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/settings/notifications:
 * get:
 * summary: Get the user's notification preferences
 * tags: [Settings]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Notification preferences retrieved
 * put:
 * summary: Create or update the user's notification preferences
 * tags: [Settings]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpsertNotificationSettings'
 * responses:
 * 200:
 * description: Notification preferences updated
 */
router
  .route('/')
  .get(notificationSettingsController.getMyNotificationSettings)
  .put(
    validate(upsertNotificationSettingsSchema),
    notificationSettingsController.updateMyNotificationSettings
  );

export default router;