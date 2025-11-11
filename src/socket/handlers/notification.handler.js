import { notificationService } from '../../services/notification.service.js';
import { logger } from '../../config/logger.js';
import { ApiError } from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../utils/constants.js';

/**
 * Setup notification event handlers for events *initiated by the client*
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 */
export const setupNotificationHandlers = (io, socket) => {
  
  /**
   * Handle marking notification as read
   */
  socket.on('notification:read', async (data, callback) => {
    try {
      const { notificationId } = data;

      if (!notificationId || typeof notificationId !== 'number') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid notification ID');
      }

      // Mark notification as read
      await notificationService.markAsRead(notificationId, socket.userId);

      if (callback) {
        callback({ success: true, notificationId });
      }

      logger.info(
        `Notification ${notificationId} marked as read by ${socket.userId}`
      );
    } catch (error) {
      logger.error('Socket error marking notification as read:', error);
      if (callback) {
        callback({ success: false, message: error.message });
      }
    }
  });

  /**
   * Handle get unread count
   */
  socket.on('notification:unread-count', async (data, callback) => {
    try {
      const count = await notificationService.getUnreadCount(socket.userId);
      
      if (callback) {
        callback({ success: true, count });
      } else {
        // Fallback for non-callback version
        socket.emit('notification:unread-count', { count });
      }
    } catch (error) {
      logger.error('Socket error getting unread count:', error);
      if (callback) {
        callback({ success: false, message: error.message });
      }
    }
  });

  /**
   * NOTE: The 'NOTIFICATION_SEND' listener has been removed.
   * Notifications should be created by services (e.g., MatchService, MessageService)
   * by calling 'notificationService.createNotification'.
   * This service now handles all dispatching (DB, Socket, Push).
   */
};