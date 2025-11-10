import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES, MATCH_STATUS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * Send match request
 * @param {string} fromUserId - Sender user ID
 * @param {string} toUserId - Receiver user ID
 * @returns {Promise<Object>}
 */
export const sendMatchRequest = async (fromUserId, toUserId) => {
  try {
    // Check if sender is same as receiver
    if (fromUserId === toUserId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot send match request to yourself');
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: toUserId },
      include: { profile: true },
    });

    if (!receiver || !receiver.profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found or profile incomplete');
    }

    // Check if match request already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });

    if (existingMatch) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Match request already exists');
    }

    const match = await prisma.match.create({
      data: {
        fromUserId,
        toUserId,
        status: MATCH_STATUS.PENDING,
      },
      include: {
        fromUser: {
          include: { profile: true },
        },
        toUser: {
          include: { profile: true },
        },
      },
    });

    logger.info(`Match request sent from ${fromUserId} to ${toUserId}`);
    return match;
  } catch (error) {
    logger.error('Error in sendMatchRequest:', error);
    throw error;
  }
};

/**
 * Accept match request
 * @param {string} matchId - Match ID
 * @param {string} userId - User ID accepting the request
 * @returns {Promise<Object>}
 */
export const acceptMatchRequest = async (matchId, userId) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        fromUser: true,
        toUser: true,
      },
    });

    if (!match) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.MATCH_NOT_FOUND);
    }

    // Check if user is the receiver of the match request
    if (match.toUserId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only accept match requests sent to you');
    }

    if (match.status !== MATCH_STATUS.PENDING) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Match request is not pending');
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { status: MATCH_STATUS.ACCEPTED },
      include: {
        fromUser: {
          include: { profile: true },
        },
        toUser: {
          include: { profile: true },
        },
      },
    });

    logger.info(`Match request accepted: ${matchId}`);
    return updatedMatch;
  } catch (error) {
    logger.error('Error in acceptMatchRequest:', error);
    throw error;
  }
};

/**
 * Reject match request
 * @param {string} matchId - Match ID
 * @param {string} userId - User ID rejecting the request
 * @returns {Promise<Object>}
 */
export const rejectMatchRequest = async (matchId, userId) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.MATCH_NOT_FOUND);
    }

    // Check if user is the receiver of the match request
    if (match.toUserId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only reject match requests sent to you');
    }

    if (match.status !== MATCH_STATUS.PENDING) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Match request is not pending');
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { status: MATCH_STATUS.REJECTED },
    });

    logger.info(`Match request rejected: ${matchId}`);
    return updatedMatch;
  } catch (error) {
    logger.error('Error in rejectMatchRequest:', error);
    throw error;
  }
};

/**
 * Get sent match requests
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const getSentMatchRequests = async (userId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);
    const { status } = query;

    const where = { fromUserId: userId };
    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limit,
        include: {
          toUser: {
            include: { profile: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.match.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      matches,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getSentMatchRequests:', error);
    throw error;
  }
};

/**
 * Get received match requests
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const getReceivedMatchRequests = async (userId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);
    const { status } = query;

    const where = { toUserId: userId };
    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limit,
        include: {
          fromUser: {
            include: { profile: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.match.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      matches,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getReceivedMatchRequests:', error);
    throw error;
  }
};

/**
 * Get accepted matches
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const getAcceptedMatches = async (userId, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
      status: MATCH_STATUS.ACCEPTED,
      OR: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limit,
        include: {
          fromUser: {
            include: { profile: true },
          },
          toUser: {
            include: { profile: true },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prisma.match.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      matches,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getAcceptedMatches:', error);
    throw error;
  }
};

/**
 * Delete match
 * @param {string} matchId - Match ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteMatch = async (matchId, userId) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.MATCH_NOT_FOUND);
    }

    // Check if user is involved in the match
    if (match.fromUserId !== userId && match.toUserId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only delete your own matches');
    }

    await prisma.match.delete({
      where: { id: matchId },
    });

    logger.info(`Match deleted: ${matchId}`);
  } catch (error) {
    logger.error('Error in deleteMatch:', error);
    throw error;
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
