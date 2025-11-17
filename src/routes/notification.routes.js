import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  notificationIdParamSchema,
  getNotificationsQuerySchema,
} from '../validation/notification.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);


router.get(
  '/',
  validate(getNotificationsQuerySchema),
  notificationController.getMyNotifications
);
router.delete('/', notificationController.deleteAllNotifications);

router.get('/unread-count', notificationController.getUnreadCount);


router.put('/read-all', notificationController.markAllAsRead);


router.put(
  '/:notificationId/read',
  validate(notificationIdParamSchema),
  notificationController.markAsRead
);


router.delete(
  '/:notificationId',
  validate(notificationIdParamSchema),
  notificationController.deleteNotification
);

export default router;