import { getMessaging } from '../config/firebase.js';
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * Send push notification via FCM
 * @param {string} fcmToken - Device FCM token
 * @param {Object} notification - Notification data
 * @returns {Promise<string>}
 */
export const sendPushNotification = async (fcmToken, notification) => {
  try {
    const messaging = getMessaging();
    
    if (!messaging) {
      logger.warn('Firebase messaging not initialized');
      return null;
    }

    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
    };

    const response = await messaging.send(message);

    logger.info(`Push notification sent: ${response}`);
    return response;
  } catch (error) {
    logger.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Create notification record
 * @param {string} userId - User ID
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Object>}
 */
export const createNotification = async (userId, message, data = {}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });

    logger.info(`Notification created for user: ${userId}`);

    // Try to send push notification if user has FCM token
    // Note: FCM token storage would need to be added to user model
    // This is a placeholder for the logic
    
    return notification;
  } catch (error) {
    logger.error('Error in createNotification:', error);
    throw error;
  }
};

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const getUserNotifications = async (userId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      notifications,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getUserNotifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return updatedNotification;
  } catch (error) {
    logger.error('Error in markAsRead:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    logger.info(`Marked ${result.count} notifications as read`);
    return result;
  } catch (error) {
    logger.error('Error in markAllAsRead:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    logger.error('Error in getUnreadCount:', error);
    throw error;
  }
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    logger.info(`Notification deleted: ${notificationId}`);
  } catch (error) {
    logger.error('Error in deleteNotification:', error);
    throw error;
  }
};

/**
 * Delete all notifications
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export const deleteAllNotifications = async (userId) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    logger.info(`Deleted ${result.count} notifications`);
    return result;
  } catch (error) {
    logger.error('Error in deleteAllNotifications:', error);
    throw error;
  }
};

export const notificationService = {
  sendPushNotification,
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
};
