import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * Send message
 * @param {string} fromUserId - Sender user ID
 * @param {string} toUserId - Receiver user ID
 * @param {string} content - Message content
 * @returns {Promise<Object>}
 */
export const sendMessage = async (fromUserId, toUserId, content) => {
  try {
    if (fromUserId === toUserId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot send message to yourself');
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: toUserId },
    });

    if (!receiver) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Receiver not found');
    }

    const message = await prisma.message.create({
      data: {
        fromUserId,
        toUserId,
        content,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Message sent from ${fromUserId} to ${toUserId}`);
    return message;
  } catch (error) {
    logger.error('Error in sendMessage:', error);
    throw error;
  }
};

/**
 * Get conversation between two users
 * @param {string} userId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const getConversation = async (userId, otherUserId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
      OR: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.message.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      messages,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getConversation:', error);
    throw error;
  }
};

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export const getAllConversations = async (userId) => {
  try {
    // Get unique users the current user has conversations with
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT
        CASE
          WHEN "fromUserId" = ${userId} THEN "toUserId"
          ELSE "fromUserId"
        END as "otherUserId",
        MAX("createdAt") as "lastMessageAt"
      FROM "Message"
      WHERE "fromUserId" = ${userId} OR "toUserId" = ${userId}
      GROUP BY "otherUserId"
      ORDER BY "lastMessageAt" DESC
    `;

    // Get user details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await prisma.user.findUnique({
          where: { id: conv.otherUserId },
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                photos: true,
              },
            },
          },
        });

        // Get last message
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { fromUserId: userId, toUserId: conv.otherUserId },
              { fromUserId: conv.otherUserId, toUserId: userId },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Get unread count
        const unreadCount = await prisma.message.count({
          where: {
            fromUserId: conv.otherUserId,
            toUserId: userId,
            isRead: false,
          },
        });

        return {
          user: otherUser,
          lastMessage,
          unreadCount,
          lastMessageAt: conv.lastMessageAt,
        };
      })
    );

    return conversationsWithDetails;
  } catch (error) {
    logger.error('Error in getAllConversations:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 * @param {string} userId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<Object>}
 */
export const markMessagesAsRead = async (userId, otherUserId) => {
  try {
    const result = await prisma.message.updateMany({
      where: {
        fromUserId: otherUserId,
        toUserId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    logger.info(`Marked ${result.count} messages as read`);
    return result;
  } catch (error) {
    logger.error('Error in markMessagesAsRead:', error);
    throw error;
  }
};

/**
 * Delete message
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId, userId) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    }

    // Only sender can delete message
    if (message.fromUserId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only delete your own messages');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    logger.info(`Message deleted: ${messageId}`);
  } catch (error) {
    logger.error('Error in deleteMessage:', error);
    throw error;
  }
};

/**
 * Get unread message count
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await prisma.message.count({
      where: {
        toUserId: userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    logger.error('Error in getUnreadCount:', error);
    throw error;
  }
};

export const messageService = {
  sendMessage,
  getConversation,
  getAllConversations,
  markMessagesAsRead,
  deleteMessage,
  getUnreadCount,
};
