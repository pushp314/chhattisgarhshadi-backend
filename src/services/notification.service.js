import { getMessaging } from '../config/firebase.js';
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, NOTIFICATION_TYPES, SOCKET_EVENTS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
import { getSocketIoInstance } from '../socket/index.js';

/**
 * Internal helper to send a single FCM push notification.
 * @param {string} fcmToken - Device FCM token
 * @param {object} payload - { title, body, data }
 * @returns {Promise<string|null>}
 */
const _sendPushNotification = async (fcmToken, payload) => {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      logger.warn('Firebase messaging not initialized, push notification skipped.');
      return null;
    }

    const message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    };

    const response = await messaging.send(message);
    logger.info(`Push notification sent: ${response}`);
    return response;
  } catch (error) {
    // Common errors: 'messaging/registration-token-not-registered' (app uninstall)
    logger.error(`Error sending push notification to ${fcmToken}: ${error.message}`);
    if (error.code === 'messaging/registration-token-not-registered') {
      // The token is invalid. Delete it from the database.
      await prisma.fcmToken.deleteMany({ where: { token: fcmToken } });
      logger.info(`Deleted invalid FCM token: ${fcmToken}`);
    }
    return null; // Don't throw, as the notification was still created
  }
};

/**
 * Create and dispatch a notification (DB, Socket, and Push).
 * This is the new single source of truth.
 *
 * @param {object} dto - Data Transfer Object
 * @param {number} dto.userId - The ID of the user to notify
 * @param {NotificationType} dto.type - The enum type of the notification
 * @param {string} dto.title - The title of the notification
 * @param {string} dto.message - The body/message of the notification
 * @param {object} [dto.data] - Optional data to send with the push notification
 * @param {string} [dto.actionUrl] - Optional URL for in-app navigation
 * @returns {Promise<Object>}
 */
export const createNotification = async (dto) => {
  const { userId, type, title, message, data = {}, actionUrl } = dto;

  try {
    // 1. Get user preferences and FCM tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        fcmTokens: {
          where: { isActive: true },
        },
        notificationPreferences: true,
      },
    });

    if (!user) {
      logger.warn(`Cannot create notification: User not found (ID: ${userId})`);
      return;
    }

    const prefs = user.notificationPreferences;

    // 2. Create the In-App notification in the DB
    // (We always do this, regardless of preferences)
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        channel: 'IN_APP', // All notifications are at least IN_APP
        data: JSON.stringify(data),
        actionUrl,
        language: user.preferredLanguage || 'HI',
      },
    });

    // 3. Send real-time In-App notification via Socket.io
    const io = getSocketIoInstance();
    if (io) {
      io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, notification);
    }

    // 4. Check push notification preferences
    // This logic assumes you have boolean flags like 'newMessagePush' in your NotificationPreferences model
    let shouldSendPush = false;
    if (prefs && prefs.enableAllNotifications) {
      switch (type) {
        case NOTIFICATION_TYPES.NEW_MESSAGE:
          shouldSendPush = prefs.newMessagePush;
          break;
        case NOTIFICATION_TYPES.MATCH_REQUEST:
          shouldSendPush = prefs.matchRequestPush;
          break;
        case NOTIFICATION_TYPES.MATCH_ACCEPTED:
          shouldSendPush = prefs.matchAcceptedPush;
          break;
        // ... add other cases
        default:
          shouldSendPush = true; // Default to sending
      }
    }

    // 5. Send FCM Push Notifications (if enabled)
    if (shouldSendPush && user.fcmTokens.length > 0) {
      const pushPayload = { title, body: message, data };
      
      // Send to all active devices for this user
      const pushPromises = user.fcmTokens.map((token) =>
        _sendPushNotification(token.token, pushPayload)
      );
      await Promise.all(pushPromises);
    }

    logger.info(`Notification created and dispatched for user: ${userId}`);
    return notification;
  } catch (error) {
    logger.error('Error in createNotification:', error);
    // Don't throw, as this is often a background task
  }
};

/**
 * Get user notifications (paginated)
 * @param {number} userId - User ID
 * @param {Object} query - Query parameters (validated)
 * @returns {Promise<Object>}
 */
export const getUserNotifications = async (userId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);

    const where = { userId };
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.notification.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      notifications,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getUserNotifications:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving notifications');
  }
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID (validated)
 * @param {number} userId - User ID
 * @returns {Promise<Object>}
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: userId }, // Combine find and auth check
    });

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found or you are not authorized');
    }

    if (notification.isRead) {
      return notification; // Already read, just return it
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return updatedNotification;
  } catch (error) {
    logger.error('Error in markAsRead:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error marking as read');
  }
};

/**
 * Mark all notifications as read
 * @param {number} userId - User ID
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
        readAt: new Date(),
      },
    });

    logger.info(`Marked ${result.count} notifications as read for user ${userId}`);
    return result;
  } catch (error) {
    logger.error('Error in markAllAsRead:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error marking all as read');
  }
};

/**
 * Get unread notification count
 * @param {number} userId - User ID
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  try {
    // This query is highly efficient due to the [userId, isRead] index
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    logger.error('Error in getUnreadCount:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error getting unread count');
  }
};

/**
 * Delete notification
 * @param {number} notificationId - Notification ID (validated)
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: userId }, // Combine find and auth check
    });

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found or you are not authorized');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    logger.info(`Notification deleted: ${notificationId}`);
  } catch (error) {
    logger.error('Error in deleteNotification:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting notification');
  }
};

/**
 * Delete all notifications
 * @param {number} userId - User ID
 * @returns {Promise<Object>}
 */
export const deleteAllNotifications = async (userId) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    logger.info(`Deleted ${result.count} notifications for user ${userId}`);
    return result;
  } catch (error) {
    logger.error('Error in deleteAllNotifications:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting all notifications');
  }
};

export const notificationService = {
  createNotification, // This is the main public function
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
};