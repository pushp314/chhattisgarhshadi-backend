import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES, MATCH_STATUS, NOTIFICATION_TYPES, SOCKET_EVENTS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
// ADDED: Import the blockService to check for blocks
import { blockService } from './block.service.js';
// ADDED: Import notificationService for push notifications
import { notificationService } from './notification.service.js';
// ADDED: Import socket for real-time match updates
import { getSocketIoInstance } from '../socket/index.js';

// Reusable Prisma select for public-facing user data
// Prevents leaking sensitive fields like email, phone, googleId, etc.
// IMPORTANT: Includes profile with media for images
const userPublicSelect = {
  id: true,
  profilePicture: true,
  role: true,
  preferredLanguage: true,
  createdAt: true,
  profile: {
    include: {
      media: {
        where: {
          type: { in: ['PROFILE_PHOTO', 'GALLERY_PHOTO'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 3, // Limit to first 3 photos for performance
      }
    }
  },
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

    // --- Check User Subscription Status with Plan Limits ---
    const sender = await prisma.user.findUnique({
      where: { id: fromUserId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE', endDate: { gt: new Date() } },
          include: { plan: true },
          take: 1,
        },
        profile: { select: { firstName: true } },
      },
    });

    const isPremiumRole = sender?.role === 'PREMIUM_USER';
    const activeSubscription = sender?.subscriptions?.[0];
    const isPremium = isPremiumRole || !!activeSubscription;

    // --- Free User Limit Check ---
    if (!isPremium) {
      const FREE_MONTHLY_LIMIT = 3;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const sentThisMonth = await prisma.matchRequest.count({
        where: {
          senderId: fromUserId,
          createdAt: { gte: startOfMonth },
        },
      });

      if (sentThisMonth >= FREE_MONTHLY_LIMIT) {
        throw new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Free users can send only ${FREE_MONTHLY_LIMIT} interest requests per month. Upgrade to Premium for unlimited requests.`
        );
      }
    }

    // --- Subscription Plan Limit Check ---
    if (activeSubscription && !isPremiumRole) {
      const maxInterests = activeSubscription.plan.maxInterestsSend;
      const usedInterests = activeSubscription.interestsUsed;

      // 0 = unlimited
      if (maxInterests !== 0 && usedInterests >= maxInterests) {
        throw new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `You have reached your interest request limit (${maxInterests}). Upgrade to Premium for unlimited requests.`,
          {
            currentPlan: activeSubscription.plan.name,
            used: usedInterests,
            max: maxInterests,
            upgradeRequired: true,
          }
        );
      }
    }
    // --- End Subscription Checks ---

    // --- Block Check ---
    const blockedIdSet = await blockService.getAllBlockedUserIds(fromUserId);
    if (blockedIdSet.has(receiverId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot interact with this user');
    }

    // Check if receiver exists and has a profile
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { profile: true },
    });

    if (!receiver || !receiver.isActive || receiver.isBanned || !receiver.profile) {
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

    // --- Increment interest usage for subscription users ---
    if (activeSubscription && !isPremiumRole) {
      await prisma.userSubscription.update({
        where: { id: activeSubscription.id },
        data: { interestsUsed: { increment: 1 } },
      });
    }
    // --- End Usage Tracking ---

    // ADDED: Send push notification to receiver
    const senderName = sender?.profile?.firstName || 'Someone';
    notificationService.createNotification({
      userId: receiverId,
      type: NOTIFICATION_TYPES.MATCH_REQUEST,
      title: 'New Interest Request!',
      message: `${senderName} is interested in your profile.`,
      data: {
        type: 'MATCH_REQUEST',
        matchId: String(match.id),
        userId: String(fromUserId),
        userName: senderName,
      },
    }).catch(err => logger.error('Failed to send match request notification:', err));

    logger.info(`Match request sent from ${fromUserId} to ${receiverId}`);

    // Return match with remaining count
    let remaining = null;
    if (!isPremium) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const sentThisMonth = await prisma.matchRequest.count({
        where: { senderId: fromUserId, createdAt: { gte: startOfMonth } },
      });
      remaining = 3 - sentThisMonth;
    } else if (activeSubscription && activeSubscription.plan.maxInterestsSend !== 0) {
      remaining = activeSubscription.plan.maxInterestsSend - (activeSubscription.interestsUsed + 1);
    }
    return { ...match, requestsRemaining: remaining };
  } catch (error) {
    logger.error('Error in sendMatchRequest:', error);
    if (error instanceof ApiError) throw error;
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

    // ADDED: Send push notification to the original sender
    const accepter = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { select: { firstName: true } } },
    });
    const accepterName = accepter?.profile?.firstName || 'Someone';
    notificationService.createNotification({
      userId: match.senderId,
      type: NOTIFICATION_TYPES.MATCH_ACCEPTED,
      title: 'Request Accepted! 🎉',
      message: `${accepterName} accepted your interest request. Start chatting now!`,
      data: {
        type: 'MATCH_ACCEPTED',
        matchId: String(matchId),
        userId: String(userId),
        userName: accepterName,
      },
    }).catch(err => logger.error('Failed to send match accepted notification:', err));

    // ADDED: Emit real-time MATCH_ACCEPTED to both users
    const io = getSocketIoInstance();
    if (io) {
      const matchData = {
        matchId,
        acceptedBy: userId,
        acceptedAt: updatedMatch.respondedAt,
      };
      // Emit to sender (original requester)
      io.to(`user:${match.senderId}`).emit(SOCKET_EVENTS.MATCH_ACCEPTED, matchData);
      // Emit to receiver (the accepter) for UI consistency
      io.to(`user:${userId}`).emit(SOCKET_EVENTS.MATCH_ACCEPTED, matchData);
    }

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