import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES, MATCH_STATUS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

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
 * @param {number} toUserId - Receiver user ID
 * @returns {Promise<Object>}
 */
export const sendMatchRequest = async (fromUserId, toUserId) => {
  try {
    // Check if sender is same as receiver
    if (fromUserId === toUserId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot send match request to yourself'
      );
    }

    // Check if receiver exists and has a profile
    const receiver = await prisma.user.findUnique({
      where: { id: toUserId },
      include: { profile: true },
    });

    if (!receiver || !receiver.profile) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'User not found or profile incomplete'
      );
    }

    // Check if match request already exists
    // The @@unique constraint in Prisma schema handles this,
    // but this provides a friendlier error message.
    const existingMatch = await prisma.matchRequest.findFirst({
      where: {
        OR: [
          { senderId: fromUserId, receiverId: toUserId },
          { senderId: toUserId, receiverId: fromUserId },
        ],
      },
    });

    if (existingMatch) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Match request already exists');
    }

    const match = await prisma.matchRequest.create({
      data: {
        senderId: fromUserId,
        receiverId: toUserId,
        status: MATCH_STATUS.PENDING,
      },
    });

    logger.info(`Match request sent from ${fromUserId} to ${toUserId}`);
    
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

    const where = { senderId: userId };
    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      prisma.matchRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          receiver: { // Renamed from toUser to match schema
            select: userPublicSelect, // Use public-safe select
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

    const where = { receiverId: userId };
    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      prisma.matchRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          sender: { // Renamed from fromUser to match schema
            select: userPublicSelect, // Use public-safe select
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

    const where = {
      status: MATCH_STATUS.ACCEPTED,
      OR: [{ senderId: userId }, { receiverId: userId }],
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