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
  // Convert notificationId to integer (route params are always strings)
  const notificationId = parseInt(req.params.notificationId, 10);
  const notification = await notificationService.markAsRead(
    notificationId,
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
  // Convert notificationId to integer (route params are always strings)
  const notificationId = parseInt(req.params.notificationId, 10);
  await notificationService.deleteNotification(
    notificationId,
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

/**
 * Register device for push notifications
 */
export const registerDevice = asyncHandler(async (req, res) => {
  const { token, deviceId, deviceType } = req.body;

  if (!token || !deviceId || !deviceType) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Missing required fields');
  }

  const result = await notificationService.registerDevice(
    req.user.id,
    token,
    deviceId,
    deviceType
  );

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Device registered successfully')
    );
});

/**
 * Unregister device (e.g. on logout)
 */
export const unregisterDevice = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Token is required');
  }

  // Decode token if it was doubly encoded (sometimes happens with slashes)
  const decodedToken = decodeURIComponent(token);

  await notificationService.unregisterDevice(req.user.id, decodedToken);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, null, 'Device unregistered successfully')
    );
});

export const notificationController = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
  registerDevice,
  unregisterDevice, // Export new method
};