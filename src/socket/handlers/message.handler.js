import { messageService } from '../../services/message.service.js';
import { logger } from '../../config/logger.js';
import { SOCKET_EVENTS, MESSAGE_STATUS } from '../../utils/constants.js';
import prisma from '../../config/database.js';

/**
 * Setup message event handlers
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 */
export const setupMessageHandlers = (io, socket) => {
  /**
   * Handle sending message
   */
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (data, callback) => {
    try {
      const { receiverId, content } = data;

      if (!receiverId || !content) {
        throw new Error('Invalid message data');
      }

      // 1. Save message to database (status: SENT by default)
      const message = await messageService.sendMessage(
        socket.userId,
        receiverId,
        content
      );

      // 2. Emit to receiver's room (will send to all their devices)
      io.to(`user:${receiverId}`).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, message);

      // 3. Acknowledge to sender that the message was sent successfully
      if (callback) {
        callback({ success: true, message });
      }

      logger.info(`Socket message sent from ${socket.userId} to ${receiverId}`);
    } catch (error) {
      logger.error(`Socket error sending message: ${error.message}`);
      // 4. Acknowledge to sender that there was an error
      if (callback) {
        callback({
          success: false,
          message: error.message || 'Failed to send message',
        });
      }
    }
  });

  /**
   * ADDED: Handle message delivered confirmation
   * When receiver's app receives a message, it sends this to confirm delivery
   */
  socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, async (data) => {
    try {
      const { messageId, senderId } = data;

      if (!messageId) {
        throw new Error('Invalid message ID for delivery confirmation');
      }

      // Update message status in database
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: MESSAGE_STATUS.DELIVERED,
          deliveredAt: new Date(),
        },
      });

      // Notify the sender that their message was delivered
      io.to(`user:${senderId}`).emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
        messageId,
        deliveredAt: new Date().toISOString(),
      });

      logger.info(`Message ${messageId} marked as delivered`);
    } catch (error) {
      logger.error('Socket error marking message as delivered:', error.message);
    }
  });

  /**
   * Handle marking messages as read
   */
  socket.on(SOCKET_EVENTS.MESSAGE_READ, async (data) => {
    try {
      // `userId` here is the *other* user, whose messages I am reading
      const { userId: otherUserId } = data;

      if (!otherUserId) {
        throw new Error('Invalid user ID for marking messages as read');
      }

      // Mark messages as read in the database
      await messageService.markMessagesAsRead(socket.userId, otherUserId);

      // Emit to the *other user* (in their room) to notify them
      io.to(`user:${otherUserId}`).emit(SOCKET_EVENTS.MESSAGE_READ, {
        byUser: socket.userId,
      });

      logger.info(`Messages marked as read by ${socket.userId} from ${otherUserId}`);
    } catch (error) {
      logger.error('Socket error marking messages as read:', error);
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
    const { receiverId } = data;
    if (receiverId) {
      // Emit to the receiver's room
      io.to(`user:${receiverId}`).emit(SOCKET_EVENTS.TYPING_START, {
        userId: socket.userId,
      });
    }
  });

  /**
   * Handle typing stop
   */
  socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
    const { receiverId } = data;
    if (receiverId) {
      // Emit to the receiver's room
      io.to(`user:${receiverId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
        userId: socket.userId,
      });
    }
  });
};