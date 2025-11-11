import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  notificationIdParamSchema,
  getNotificationsQuerySchema,
} from '../validations/notification.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get my notifications (paginated)
 * @access  Private
 */
router.get(
  '/',
  validate(getNotificationsQuerySchema),
  notificationController.getMyNotifications
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete('/', notificationController.deleteAllNotifications);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.put(
  '/:notificationId/read',
  validate(notificationIdParamSchema),
  notificationController.markAsRead
);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a single notification
 * @access  Private
 */
router.delete(
  '/:notificationId',
  validate(notificationIdParamSchema),
  notificationController.deleteNotification
);

export default router;