import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
// ADDED: Import the blockService to check for blocks
import { blockService } from './block.service.js';

// Define a reusable Prisma select for public-facing user data
// This prevents leaking sensitive fields like email, phone, googleId, etc.
const userPublicSelect = {
  id: true,
  profilePicture: true,
  role: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
};

/**
 * Send message
 * @param {number} senderId - Sender user ID
 * @param {number} receiverId - Receiver user ID
 * @param {string} content - Message content
 * @returns {Promise<Object>}
 */
export const sendMessage = async (senderId, receiverId, content) => {
  try {
    if (senderId === receiverId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot send message to yourself'
      );
    }

    // --- Block Check [ADDED] ---
    const blockedIdSet = await blockService.getAllBlockedUserIds(senderId);
    if (blockedIdSet.has(receiverId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot send messages to this user');
    }
    // --- End Block Check ---

    // Check if receiver exists and is active
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId, isActive: true, isBanned: false }, // ADDED: isActive/isBanned
    });

    if (!receiver) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Receiver not found');
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: userPublicSelect,
        },
        receiver: {
          select: userPublicSelect,
        },
      },
    });

    logger.info(`Message sent from ${senderId} to ${receiverId}`);
    return message;
  } catch (error) {
    logger.error('Error in sendMessage:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error sending message');
  }
};

/**
 * Get conversation between two users
 * @param {number} userId - Current user ID
 * @param {number} otherUserId - Other user ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const getConversation = async (userId, otherUserId, query) => {
  try {
    // --- Block Check [ADDED] ---
    // Note: We check this *before* loading the conversation.
    // If you want to allow users to see old messages, remove this check.
    // But this implementation prevents loading the chat screen entirely.
    const blockedIdSet = await blockService.getAllBlockedUserIds(userId);
    if (blockedIdSet.has(otherUserId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot view this conversation');
    }
    // --- End Block Check ---

    const { page, limit, skip } = getPaginationParams(query);

    const where = {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        include: {
          sender: {
            select: userPublicSelect,
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
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving conversation');
  }
};

/**
 * Get all conversations for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>}
 */
export const getAllConversations = async (userId) => {
  try {
    // --- Block Check [ADDED] ---
    const blockedIdSet = await blockService.getAllBlockedUserIds(userId);
    // --- End Block Check ---

    // Step 1: Get all distinct conversation partners and the timestamp of the last message
    const conversationPartners = await prisma.$queryRaw`
      SELECT "otherUserId", MAX("createdAt") as "lastMessageAt"
      FROM (
        SELECT "receiverId" as "otherUserId", "createdAt" FROM "messages" WHERE "senderId" = ${userId}
        UNION ALL
        SELECT "senderId" as "otherUserId", "createdAt" FROM "messages" WHERE "receiverId" = ${userId}
      ) as "allConversations"
      GROUP BY "otherUserId"
      ORDER BY "lastMessageAt" DESC
    `;

    // [MODIFIED] Filter out blocked partners
    const filteredPartners = conversationPartners.filter(
      (c) => !blockedIdSet.has(c.otherUserId)
    );

    if (filteredPartners.length === 0) {
      return [];
    }

    const otherUserIds = filteredPartners.map((c) => c.otherUserId);

    // Step 2: Get all user details for these partners in one query
    const users = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      select: userPublicSelect,
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    // Step 3: Get all last messages for these conversations in one query
    const lastMessages = await prisma.$queryRaw`
      SELECT m.*
      FROM "messages" m
      INNER JOIN (
        SELECT
          LEAST("senderId", "receiverId") as u1,
          GREATEST("senderId", "receiverId") as u2,
          MAX("createdAt") as "maxCreatedAt"
        FROM "messages"
        WHERE ("senderId" = ${userId} AND "receiverId" IN (${Prisma.join(otherUserIds)}))
           OR ("receiverId" = ${userId} AND "senderId" IN (${Prisma.join(otherUserIds)}))
        GROUP BY u1, u2
      ) lm ON LEAST(m."senderId", m."receiverId") = lm.u1
           AND GREATEST(m."senderId", m."receiverId") = lm.u2
           AND m."createdAt" = lm."maxCreatedAt"
    `;
    const lastMessageMap = new Map(
      lastMessages.map((m) => [
        m.senderId === userId ? m.receiverId : m.senderId,
        m,
      ])
    );

    // Step 4: Get all unread counts in one query
    const unreadCounts = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        senderId: { in: otherUserIds },
        isRead: false,
      },
      _count: {
        id: true,
      },
    });
    const unreadCountMap = new Map(
      unreadCounts.map((c) => [c.senderId, c._count.id])
    );

    // Step 5: Combine all the data
    const conversationsWithDetails = filteredPartners.map((conv) => { // [MODIFIED]
      const otherUser = userMap.get(conv.otherUserId);
      const lastMessage = lastMessageMap.get(conv.otherUserId);
      const unreadCount = unreadCountMap.get(conv.otherUserId) || 0;

      return {
        user: otherUser,
        lastMessage,
        unreadCount,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    return conversationsWithDetails;
  } catch (error) {
    logger.error('Error in getAllConversations:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving conversations');
  }
};


/**
 * Mark messages as read
 * @param {number} userId - Current user ID
 * @param {number} otherUserId - Other user ID
 * @returns {Promise<Object>}
 */
export const markMessagesAsRead = async (userId, otherUserId) => {
  try {
    // --- Block Check [ADDED] ---
    // Prevent marking as read if user is blocked (as they shouldn't see conversation)
    const blockedIdSet = await blockService.getAllBlockedUserIds(userId);
    if (blockedIdSet.has(otherUserId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot interact with this user');
    }
    // --- End Block Check ---

    const result = await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    logger.info(`Marked ${result.count} messages as read from ${otherUserId} for ${userId}`);
    return result;
  } catch (error) {
    logger.error('Error in markMessagesAsRead:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error marking messages as read');
  }
};

/**
 * Delete message
 * @param {number} messageId - Message ID
 * @param {number} userId - User ID
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
    if (message.senderId !== userId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only delete your own messages'
      );
    }
    
    // No block check needed - user is allowed to delete their *own* messages.

    // We will just mark as deleted for now, so the receiver can still see it.
    // To truly delete, use prisma.message.delete()
    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: 'This message was deleted',
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      }
    });

    logger.info(`Message marked as deleted: ${messageId}`);
  } catch (error) {
    logger.error('Error in deleteMessage:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting message');
  }
};

/**
 * Get unread message count
 * @param {number} userId - User ID
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  try {
    // --- Block Check [ADDED] ---
    const blockedIdSet = await blockService.getAllBlockedUserIds(userId);
    // --- End Block Check ---

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
        senderId: { notIn: Array.from(blockedIdSet) }, // [MODIFIED]
      },
    });

    return count;
  } catch (error) {
    logger.error('Error in getUnreadCount:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error getting unread count');
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