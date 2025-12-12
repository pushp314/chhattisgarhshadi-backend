import { getMessaging } from '../config/firebase.js';
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, NOTIFICATION_TYPES, SOCKET_EVENTS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
import { getSocketIoInstance } from '../socket/index.js';
import { isRateLimited } from './rateLimit.service.js';

// ===== NOTIFICATION METRICS =====
const metrics = {
  notificationsSent: 0,
  notificationsFailed: 0,
  invalidTokensRemoved: 0,
  pushNotificationsSent: 0,
  pushNotificationsFailed: 0,
};

// Log metrics every hour
setInterval(() => {
  logger.info('📊 FCM Metrics (last hour):', metrics);
  // Reset after logging
  Object.keys(metrics).forEach(key => metrics[key] = 0);
}, 60 * 60 * 1000);

/**
 * Helper: Sleep for exponential backoff
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper: Check if error is permanent (don't retry)
 */
const isPermanentError = (error) => {
  const permanentCodes = [
    'messaging/registration-token-not-registered',
    'messaging/invalid-argument',
    'messaging/invalid-recipient',
    'messaging/invalid-registration-token',
  ];
  return permanentCodes.includes(error.code);
};

/**
 * Internal helper to send a single FCM push notification with retry logic.
 * @param {string} fcmToken - Device FCM token
 * @param {object} payload - { title, body, data, notificationType }
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string|null>}
 */
const _sendPushNotification = async (fcmToken, payload, maxRetries = 3) => {
  const messaging = getMessaging();
  if (!messaging) {
    logger.warn('⚠️ Firebase messaging not initialized, push notification skipped.');
    return null;
  }

  // Determine notification channel based on type
  const getAndroidChannel = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.MESSAGE:
        return 'messages_channel';
      case NOTIFICATION_TYPES.MATCH_REQUEST:
      case NOTIFICATION_TYPES.MATCH_ACCEPTED:
        return 'matches_channel';
      case NOTIFICATION_TYPES.PROFILE_VIEWED:
        return 'profile_views_channel';
      default:
        return 'general_channel';
    }
  };

  const message = {
    token: fcmToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      ...payload.data,
      // Ensure all data values are strings  
      type: String(payload.data?.type || 'GENERAL'),
      timestamp: String(Date.now()),
    },
    // Android-specific configuration with RICH NOTIFICATIONS
    android: {
      priority: 'high',
      notification: {
        channelId: getAndroidChannel(payload.notificationType),
        sound: 'default',
        priority: 'high',
        defaultSound: true,
        defaultVibrateTimings: true,
        // Rich features
        imageUrl: payload.data?.imageUrl, // Big picture style
        color: '#E91E63', // Brand color for matrimony app
        // Action buttons based on notification type
        ...(payload.notificationType === 'MESSAGE' && {
          actions: [
            { title: 'Reply', action: 'REPLY_ACTION' },
            { title: 'Mark as Read', action: 'MARK_READ_ACTION' },
          ],
        }),
        ...(payload.notificationType === 'MATCH_REQUEST' && {
          actions: [
            { title: 'Accept', action: 'ACCEPT_MATCH_ACTION' },
            { title: 'Reject', action: 'REJECT_MATCH_ACTION' },
          ],
        }),
        ...(payload.notificationType === 'CONTACT_REQUEST' && {
          actions: [
            { title: 'Approve', action: 'APPROVE_CONTACT_ACTION' },
            { title: 'Decline', action: 'DECLINE_CONTACT_ACTION' },
          ],
        }),
      },
    },
    // iOS-specific configuration (APNs) with RICH NOTIFICATIONS
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: payload.data?.badgeCount || 1,
          'content-available': 1, // Enable background refresh
          'mutable-content': 1, // Enable notification service extension for rich media
        },
      },
      headers: {
        'apns-priority': '10', // High priority
      },
      // iOS actions (requires UNNotificationCategory configuration in app)
      fcmOptions: {
        imageUrl: payload.data?.imageUrl, // Attach image
      },
    },
  };

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await messaging.send(message);
      logger.info(`✅ Push notification sent successfully: ${response}`);
      metrics.pushNotificationsSent++;
      return response;
    } catch (error) {
      logger.error(`❌ Push notification error (attempt ${attempt}/${maxRetries}): ${error.message}`);

      // Permanent errors - don't retry, cleanup token
      if (isPermanentError(error)) {
        logger.warn(`🗑️ Invalid FCM token detected, removing: ${fcmToken.substring(0, 20)}...`);
        try {
          await prisma.fcmToken.deleteMany({ where: { token: fcmToken } });
          metrics.invalidTokensRemoved++;
          logger.info(`✅ Deleted invalid FCM token: ${fcmToken.substring(0, 20)}...`);
        } catch (dbError) {
          logger.error(`❌ Failed to delete invalid token: ${dbError.message}`);
        }
        metrics.pushNotificationsFailed++;
        return null;
      }

      // Transient errors - retry with exponential backoff
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        logger.warn(`🔄 Retrying FCM send in ${Math.round(delayMs)}ms...`);
        await sleep(delayMs);
      } else {
        logger.error(`❌ FCM send failed after ${maxRetries} attempts`);
        metrics.pushNotificationsFailed++;
        return null;
      }
    }
  }
};

/**
 * Internal helper to send FCM to multiple devices using multicast.
 * More efficient than individual sends for users with multiple devices.
 * @param {string[]} fcmTokens - Array of FCM tokens (max 500)
 * @param {object} payload - { title, body, data, notificationType }
 * @returns {Promise<void>}
 */
const _sendMulticastNotification = async (fcmTokens, payload) => {
  const messaging = getMessaging();
  if (!messaging) {
    logger.warn('⚠️ Firebase messaging not initialized, multicast skipped.');
    return;
  }

  if (fcmTokens.length === 0) return;

  // FCM allows max 500 tokens per multicast
  const BATCH_SIZE = 500;
  const batches = [];
  for (let i = 0; i < fcmTokens.length; i += BATCH_SIZE) {
    batches.push(fcmTokens.slice(i, i + BATCH_SIZE));
  }

  const getAndroidChannel = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.MESSAGE:
        return 'messages_channel';
      case NOTIFICATION_TYPES.MATCH_REQUEST:
      case NOTIFICATION_TYPES.MATCH_ACCEPTED:
        return 'matches_channel';
      case NOTIFICATION_TYPES.PROFILE_VIEWED:
        return 'profile_views_channel';
      default:
        return 'general_channel';
    }
  };

  for (const tokenBatch of batches) {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...payload.data,
        type: String(payload.data?.type || 'GENERAL'),
        timestamp: String(Date.now()),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: getAndroidChannel(payload.notificationType),
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: payload.data?.badgeCount || 1,
            'content-available': 1,
          },
        },
        headers: {
          'apns-priority': '10',
        },
      },
      tokens: tokenBatch,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      logger.info(
        `📤 Multicast sent: ${response.successCount}/${tokenBatch.length} successful, ` +
        `${response.failureCount} failed`
      );

      metrics.pushNotificationsSent += response.successCount;
      metrics.pushNotificationsFailed += response.failureCount;

      // Cleanup failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && isPermanentError(resp.error)) {
            failedTokens.push(tokenBatch[idx]);
          }
        });

        if (failedTokens.length > 0) {
          await prisma.fcmToken.deleteMany({
            where: { token: { in: failedTokens } },
          });
          metrics.invalidTokensRemoved += failedTokens.length;
          logger.info(`🗑️ Removed ${failedTokens.length} invalid tokens from multicast`);
        }
      }
    } catch (error) {
      logger.error(`❌ Multicast send error: ${error.message}`);
      metrics.pushNotificationsFailed += tokenBatch.length;
    }
  }
};

/**
 * Create and dispatch a notification (DB, Socket, and Push).
 * This is the new single source of truth for all notifications.
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
    // ✅ RATE LIMITING: Check if user is being spammed
    if (isRateLimited(userId, type)) {
      logger.warn(`⏱️  Notification rate limited for user ${userId}, type: ${type}`);
      metrics.notificationsFailed++;
      return null; // Silently skip - don't spam user
    }

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
      logger.warn(`⚠️ Cannot create notification: User not found (ID: ${userId})`);
      return;
    }

    const prefs = user.notificationPreferences;

    // 2. Create the In-App notification in the DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        channel: 'IN_APP',
        data: JSON.stringify(data),
        actionUrl,
        language: user.preferredLanguage || 'HI',
      },
    });

    metrics.notificationsSent++;

    // 3. Send real-time In-App notification via Socket.io
    const io = getSocketIoInstance();
    if (io) {
      io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, notification);
      logger.debug(`🔌 Socket notification sent to user:${userId}`);
    }

    // 4. Determine if we should send push notifications
    let shouldSendPush = true;

    // Only skip push if user has explicitly disabled ALL notifications
    if (prefs && prefs.enableAllNotifications === false) {
      shouldSendPush = false;
      logger.info(`⏭️  Push skipped for user ${userId} - notifications disabled`);
    }

    // 5. Send FCM Push Notifications using MULTICAST for efficiency
    if (shouldSendPush && user.fcmTokens.length > 0) {
      const pushPayload = {
        title,
        body: message,
        data: {
          ...data,
          type,
          userId: String(userId),
          timestamp: String(Date.now()),
        },
        notificationType: type,
      };

      // Use multicast for efficiency
      const tokens = user.fcmTokens.map(t => t.token);
      await _sendMulticastNotification(tokens, pushPayload);

      logger.info(
        `📲 Push notifications dispatched to ${user.fcmTokens.length} device(s) for user ${userId}`
      );
    } else if (user.fcmTokens.length === 0) {
      logger.warn(`⚠️  No FCM tokens found for user ${userId}, push notification skipped`);
    }

    logger.info(`✅ Notification created and dispatched for user: ${userId}`);
    return notification;
  } catch (error) {
    logger.error('❌ Error in createNotification:', error);
    metrics.notificationsFailed++;
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
      where: { id: notificationId, userId: userId },
    });

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found or you are not authorized');
    }

    if (notification.isRead) {
      return notification;
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

    logger.info(`✅ Marked ${result.count} notifications as read for user ${userId}`);
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
      where: { id: notificationId, userId: userId },
    });

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found or you are not authorized');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    logger.info(`🗑️  Notification deleted: ${notificationId}`);
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

    logger.info(`🗑️  Deleted ${result.count} notifications for user ${userId}`);
    return result;
  } catch (error) {
    logger.error('Error in deleteAllNotifications:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting all notifications');
  }
};

/**
 * Get current notification metrics (for monitoring)
 * @returns {object}
 */
export const getMetrics = () => {
  return { ...metrics };
};

export const notificationService = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
  getMetrics,
};