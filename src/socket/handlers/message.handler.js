import { messageService } from '../../services/message.service.js';
import { logger } from '../../config/logger.js';
import { SOCKET_EVENTS } from '../../utils/constants.js';
import { emitToUser } from '../index.js';

/**
 * Setup message event handlers
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 */
export const setupMessageHandlers = (io, socket) => {
  /**
   * Handle sending message
   */
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (data) => {
    try {
      const { toUserId, content } = data;

      if (!toUserId || !content) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Save message to database
      const message = await messageService.sendMessage(
        socket.userId,
        toUserId,
        content
      );

      // Emit to sender (confirmation)
      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
        success: true,
        message,
      });

      // Emit to receiver (if online)
      emitToUser(io, toUserId, SOCKET_EVENTS.MESSAGE_RECEIVED, message);

      logger.info(`Message sent from ${socket.userId} to ${toUserId}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', {
        message: 'Failed to send message',
        error: error.message,
      });
    }
  });

  /**
   * Handle marking messages as read
   */
  socket.on(SOCKET_EVENTS.MESSAGE_READ, async (data) => {
    try {
      const { userId } = data;

      if (!userId) {
        socket.emit('error', { message: 'Invalid user ID' });
        return;
      }

      // Mark messages as read
      await messageService.markMessagesAsRead(socket.userId, userId);

      // Emit to sender (notify that messages were read)
      emitToUser(io, userId, SOCKET_EVENTS.MESSAGE_READ, {
        userId: socket.userId,
      });

      logger.info(`Messages marked as read by ${socket.userId} from ${userId}`);
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      socket.emit('error', {
        message: 'Failed to mark messages as read',
        error: error.message,
      });
    }
  });

  /**
   * Handle typing start
   */
  socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
    try {
      const { toUserId } = data;

      if (!toUserId) {
        return;
      }

      // Emit to receiver
      emitToUser(io, toUserId, SOCKET_EVENTS.TYPING_START, {
        userId: socket.userId,
      });
    } catch (error) {
      logger.error('Error handling typing start:', error);
    }
  });

  /**
   * Handle typing stop
   */
  socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
    try {
      const { toUserId } = data;

      if (!toUserId) {
        return;
      }

      // Emit to receiver
      emitToUser(io, toUserId, SOCKET_EVENTS.TYPING_STOP, {
        userId: socket.userId,
      });
    } catch (error) {
      logger.error('Error handling typing stop:', error);
    }
  });
};
