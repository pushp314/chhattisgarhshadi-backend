import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { notificationService } from '../services/notification.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get my notifications
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  // req.query is validated
  const result = await notificationService.getUserNotifications(req.user.id, req.query);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Notifications retrieved successfully')
    );
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  // req.params.notificationId is validated and coerced to a number
  const notification = await notificationService.markAsRead(
    req.params.notificationId,
    req.user.id
  );

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, notification, 'Notification marked as read')
    );
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'All notifications marked as read')
    );
});

/**
 * Get unread notification count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, { count }, 'Unread count retrieved successfully')
    );
});

/**
 * Delete notification
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  // req.params.notificationId is validated and coerced to a number
  await notificationService.deleteNotification(
    req.params.notificationId,
    req.user.id
  );

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, null, 'Notification deleted successfully')
    );
});

/**
 * Delete all notifications
 */
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteAllNotifications(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'All notifications deleted')
    );
});

export const notificationController = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
};