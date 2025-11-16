import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES, MATCH_STATUS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
// ADDED: Import the blockService to check for blocks
import { blockService } from './block.service.js';

// Reusable Prisma select for public-facing user data
// Prevents leaking sensitive fields like email, phone, googleId, etc.
const userPublicSelect = {
  id: true,
  profilePicture: true,
  role: true,
  preferredLanguage: true,
  createdAt: true,
  profile: true, // Include the full related profile
};

/**
 * Send match request
 * @param {number} fromUserId - Sender user ID
 * @param {number} receiverId - Receiver user ID
 * @param {string} message - Optional message to receiver
 * @returns {Promise<Object>}
 */
export const sendMatchRequest = async (fromUserId, receiverId, message) => {
  try {
    // Check if sender is same as receiver
    if (fromUserId === receiverId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot send match request to yourself'
      );
    }

    // --- Block Check [ADDED] ---
    // Check if either user has blocked the other
    const blockedIdSet = await blockService.getAllBlockedUserIds(fromUserId);
    if (blockedIdSet.has(receiverId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot interact with this user');
    }
    // --- End Block Check ---

    // Check if receiver exists, is active, and has a profile
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId, isActive: true, isBanned: false }, // ADDED: isActive/isBanned check
      include: { profile: true },
    });

    if (!receiver || !receiver.profile) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'User not found or profile incomplete'
      );
    }

    // Check if match request already exists
    const existingMatch = await prisma.matchRequest.findFirst({
      where: {
        OR: [
          { senderId: fromUserId, receiverId: receiverId },
          { senderId: receiverId, receiverId: fromUserId },
        ],
      },
    });

    if (existingMatch) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Match request already exists');
    }

    const match = await prisma.matchRequest.create({
      data: {
        senderId: fromUserId,
        receiverId: receiverId,
        status: MATCH_STATUS.PENDING,
        message: message || null,
      },
    });

    logger.info(`Match request sent from ${fromUserId} to ${receiverId}`);
    
    // Return the minimal match object, not the full user profiles
    return match;
  } catch (error) {
    logger.error('Error in sendMatchRequest:', error);
    if (error instanceof ApiError) throw error;
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Match request already exists');
    }
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error sending match request');
  }
};

/**
 * Accept match request
 * @param {number} matchId - Match ID
 * @param {number} userId - User ID accepting the request
 * @returns {Promise<Object>}
 */
export const acceptMatchRequest = async (matchId, userId) => {
  try {
    const match = await prisma.matchRequest.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.MATCH_NOT_FOUND);
    }

    // Security Check: Check if user is the receiver
    if (match.receiverId !== userId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only accept match requests sent to you'
      );
    }

    if (match.status !== MATCH_STATUS.PENDING) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Match request is not pending');
    }

    // --- Block Check [ADDED] ---
    // Check if the user has blocked the sender since receiving the request
    const blockedIdSet = await blockService.getAllBlockedUserIds(userId);
    if (blockedIdSet.has(match.senderId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot accept a request from a blocked user');
    }
    // --- End Block Check ---

    const updatedMatch = await prisma.matchRequest.update({
      where: { id: matchId },
      data: { status: MATCH_STATUS.ACCEPTED, respondedAt: new Date() },
    });

    logger.info(`Match request accepted: ${matchId}`);
    return updatedMatch;
  } catch (error) {
    logger.error('Error in acceptMatchRequest:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error accepting match request');
  }
};

/**
 * Reject match request
 * @param {number} matchId - Match ID
 * @param {number} userId - User ID rejecting the request
 * @returns {Promise<Object>}
 */
export const rejectMatchRequest = async (matchId, userId) => {
  try {
    const match = await prisma.matchRequest.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.MATCH_NOT_FOUND);
    }

    // Security Check: Check if user is the receiver
    if (match.receiverId !== userId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only reject match requests sent to you'
      );
    }

    if (match.status !== MATCH_STATUS.PENDING) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Match request is not pending');
    }

    // No block check needed here - rejecting a request from a blocked user is fine.

    const updatedMatch = await prisma.matchRequest.update({
      where: { id: matchId },
      data: { status: MATCH_STATUS.REJECTED, respondedAt: new Date() },
    });

    logger.info(`Match request rejected: ${matchId}`);
    return updatedMatch;
  } catch (error) {
    logger.error('Error in rejectMatchRequest:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error rejecting match request');
  }
};

/**
 * Get sent match requests
 * @param {number} userId - User ID
 * @param {Object} query - Query parameters (validated)
 * @returns {Promise<Object>}
 */
export const getSentMatchRequests = async (userId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);
    const { status } = query;

    // --- Block Check [ADDED] ---
    const blockedIds = Array.from(await blockService.getAllBlockedUserIds(userId));

    const where = { 
      senderId: userId,
      receiverId: { notIn: blockedIds }, // Don't show requests sent to blocked users
    };
    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      prisma.matchRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          receiver: { 
            select: userPublicSelect, 
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.matchRequest.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      matches,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getSentMatchRequests:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving sent requests');
  }
};

/**
 * Get received match requests
 * @param {number} userId - User ID
 * @param {Object} query - Query parameters (validated)
 * @returns {Promise<Object>}
 */
export const getReceivedMatchRequests = async (userId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);
    const { status } = query;

    // --- Block Check [ADDED] ---
    const blockedIds = Array.from(await blockService.getAllBlockedUserIds(userId));

    const where = { 
      receiverId: userId,
      senderId: { notIn: blockedIds }, // Don't show requests from blocked users
    };
    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      prisma.matchRequest.findMany({
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
      prisma.matchRequest.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      matches,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getReceivedMatchRequests:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving received requests');
  }
};

/**
 * Get accepted matches (connections)
 * @param {number} userId - User ID
 * @param {Object} query - Query parameters (validated)
 * @returns {Promise<Object>}
 */
export const getAcceptedMatches = async (userId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);

    // --- Block Check [ADDED] ---
    const blockedIds = Array.from(await blockService.getAllBlockedUserIds(userId));

    const where = {
      status: MATCH_STATUS.ACCEPTED,
      // Only find matches where THIS user is involved
      // AND the OTHER user is NOT in the blocked list.
      OR: [
        { senderId: userId, receiverId: { notIn: blockedIds } },
        { receiverId: userId, senderId: { notIn: blockedIds } }
      ],
    };

    const [matches, total] = await Promise.all([
      prisma.matchRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          sender: {
            select: userPublicSelect,
          },
          receiver: {
            select: userPublicSelect,
          },
        },
        orderBy: {
          respondedAt: 'desc', // Order by when it was accepted
        },
      }),
      prisma.matchRequest.count({ where }),
    ]);

    // Format for mobile app to easily show "the other user"
    const connections = matches.map((match) => {
      const otherUser = match.senderId === userId ? match.receiver : match.sender;
      return {
        matchId: match.id,
        status: match.status,
        acceptedAt: match.respondedAt,
        user: otherUser,
      };
    });

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      connections, // Renamed for clarity
      pagination,
    };
  } catch (error) {
    logger.error('Error in getAcceptedMatches:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving accepted matches');
  }
};

/**
 * Delete match (or cancel sent request)
 * @param {number} matchId - Match ID
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteMatch = async (matchId, userId) => {
  try {
    const match = await prisma.matchRequest.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.MATCH_NOT_FOUND);
    }

    // Security Check: Check if user is involved in the match
    if (match.senderId !== userId && match.receiverId !== userId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only delete your own matches'
      );
    }
    
    // No block check needed, user is allowed to delete a match
    // even if the other user is blocked.

    await prisma.matchRequest.delete({
      where: { id: matchId },
    });

    logger.info(`Match deleted: ${matchId}`);
  } catch (error) {
    logger.error('Error in deleteMatch:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting match');
  }
};

export const matchService = {
  sendMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  getSentMatchRequests,
  getReceivedMatchRequests,
  getAcceptedMatches,
  deleteMatch,
};