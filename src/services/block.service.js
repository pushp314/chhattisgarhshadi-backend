import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

// Reusable select for public user data (to nest in the response)
const userPublicSelect = {
  id: true,
  profilePicture: true,
  role: true,
  preferredLanguage: true,
  profile: true, // Include the full related profile
};

/**
 * Block a user
 * @param {number} blockerId - The user initiating the block
 * @param {number} blockedId - The user being blocked
 * @param {string} [reason] - An optional reason
 * @returns {Promise<Object>} The created block entry
 */
export const blockUser = async (blockerId, blockedId, reason) => {
  if (blockerId === blockedId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You cannot block yourself');
  }

  try {
    // Check if the user being blocked exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: blockedId, isActive: true },
    });

    if (!userToBlock) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'The user you are trying to block does not exist');
    }

    // Use a transaction to create the block AND sever all ties
    const [blockEntry] = await prisma.$transaction([
      // 1. Create the block entry
      prisma.blockedUser.create({
        data: {
          blockerId,
          blockedId,
          reason: reason || null,
        },
      }),
      
      // 2. Delete any existing match requests between them (both ways)
      prisma.matchRequest.deleteMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId },
          ],
        },
      }),

      // 3. Delete any shortlist entries (both ways)
      prisma.shortlist.deleteMany({
        where: {
          OR: [
            { userId: blockerId, shortlistedUserId: blockedId },
            { userId: blockedId, shortlistedUserId: blockerId },
          ],
        },
      }),
    ]);

    logger.info(`User ${blockerId} blocked user ${blockedId}. Matches and shortlists cleared.`);
    return blockEntry;

  } catch (error) {
    logger.error('Error in blockUser:', error);
    if (error.code === 'P2002') { // Unique constraint violation
      throw new ApiError(HTTP_STATUS.CONFLICT, 'This user is already blocked');
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error blocking user');
  }
};

/**
 * Unblock a user
 * @param {number} blockerId - The user initiating the unblock
 * @param {number} blockedId - The user being unblocked
 * @returns {Promise<void>}
 */
export const unblockUser = async (blockerId, blockedId) => {
  try {
    const result = await prisma.blockedUser.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });

    if (result.count === 0) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found in your block list');
    }

    logger.info(`User ${blockerId} unblocked user ${blockedId}`);
  } catch (error) {
    logger.error('Error in unblockUser:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error unblocking user');
  }
};

/**
 * Get the logged-in user's list of blocked users (paginated)
 * @param {number} blockerId - The user who is requesting their list
 * @param {Object} query - Pagination query params (page, limit)
 * @returns {Promise<Object>} Paginated list of blocked user profiles
 */
export const getMyBlockedList = async (blockerId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  try {
    const where = { blockerId };

    const [blockEntries, total] = await Promise.all([
      prisma.blockedUser.findMany({
        where,
        skip,
        take: limit,
        include: {
          blocked: { // Get the full profile of the user who was blocked
            select: userPublicSelect,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.blockedUser.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    // Format the response to be a list of user profiles
    const profiles = blockEntries.map(entry => ({
      ...entry.blocked,
      blockReason: entry.reason,
      blockedAt: entry.createdAt,
    }));

    return {
      profiles,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getMyBlockedList:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving blocked list');
  }
};

/**
 * Get a set of all user IDs that the given user has blocked OR been blocked by.
 * This is a crucial helper function for other services (match, message, search).
 * @param {number} userId - The user's ID
 * @returns {Promise<Set<number>>} A Set containing all user IDs to be hidden.
 */
export const getAllBlockedUserIds = async (userId) => {
  try {
    const blocks = await prisma.blockedUser.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId },
        ],
      },
      select: {
        blockerId: true,
        blockedId: true,
      },
    });

    const blockedIdSet = new Set();
    for (const block of blocks) {
      if (block.blockerId === userId) {
        blockedIdSet.add(block.blockedId);
      } else {
        blockedIdSet.add(block.blockerId);
      }
    }
    
    return blockedIdSet;
  } catch (error) {
    logger.error(`Error in getAllBlockedUserIds for user ${userId}:`, error);
    // Return an empty set on error to avoid breaking other services
    return new Set();
  }
};


export const blockService = {
  blockUser,
  unblockUser,
  getMyBlockedList,
  getAllBlockedUserIds, // Exporting the helper
};