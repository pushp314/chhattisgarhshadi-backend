import { notificationService } from '../../services/notification.service.js';
import { logger } from '../../config/logger.js';
import { SOCKET_EVENTS } from '../../utils/constants.js';
import { emitToUser } from '../index.js';

/**
 * Setup notification event handlers
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 */
export const setupNotificationHandlers = (io, socket) => {
  /**
   * Handle sending notification
   */
  socket.on(SOCKET_EVENTS.NOTIFICATION_SEND, async (data) => {
    try {
      const { toUserId, message, type, metadata } = data;

      if (!toUserId || !message) {
        socket.emit('error', { message: 'Invalid notification data' });
        return;
      }

      // Save notification to database
      const notification = await notificationService.createNotification(
        toUserId,
        message,
        metadata
      );

      // Emit to receiver (if online)
      emitToUser(io, toUserId, SOCKET_EVENTS.NOTIFICATION_RECEIVED, {
        ...notification,
        type,
      });

      logger.info(`Notification sent to ${toUserId}`);
    } catch (error) {
      logger.error('Error sending notification:', error);
      socket.emit('error', {
        message: 'Failed to send notification',
        error: error.message,
      });
    }
  });

  /**
   * Handle marking notification as read
   */
  socket.on('notification:read', async (data) => {
    try {
      const { notificationId } = data;

      if (!notificationId) {
        socket.emit('error', { message: 'Invalid notification ID' });
        return;
      }

      // Mark notification as read
      await notificationService.markAsRead(notificationId, socket.userId);

      socket.emit('notification:read', {
        success: true,
        notificationId,
      });

      logger.info(`Notification ${notificationId} marked as read by ${socket.userId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      socket.emit('error', {
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  });

  /**
   * Handle get unread count
   */
  socket.on('notification:unread-count', async () => {
    try {
      const count = await notificationService.getUnreadCount(socket.userId);

      socket.emit('notification:unread-count', { count });
    } catch (error) {
      logger.error('Error getting unread count:', error);
      socket.emit('error', {
        message: 'Failed to get unread count',
        error: error.message,
      });
    }
  });
};

/**
 * Broadcast notification to user
 * @param {Object} io - Socket.io instance
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
export const broadcastNotification = (io, userId, notification) => {
  emitToUser(io, userId, SOCKET_EVENTS.NOTIFICATION_RECEIVED, notification);
};
