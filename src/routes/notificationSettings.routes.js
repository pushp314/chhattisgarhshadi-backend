import { Router } from 'express';
import { notificationSettingsController } from '../controllers/notificationSettings.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { upsertNotificationSettingsSchema } from '../validation/notificationSettings.validation.js';

const router = Router();

// All notification settings routes require authentication
router.use(authenticate);


router
  .route('/')
  .get(notificationSettingsController.getMyNotificationSettings)
  .put(
    validate(upsertNotificationSettingsSchema),
    notificationSettingsController.updateMyNotificationSettings
  );

export default router;