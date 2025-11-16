import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
// FIX: Removed unused ERROR_MESSAGES import
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
 * Add a user to the logged-in user's shortlist
 * @param {number} userId - The user doing the shortlisting
 * @param {number} shortlistedUserId - The user being shortlisted
 * @param {string} [note] - An optional note
 * @returns {Promise<Object>} The created shortlist entry
 */
export const addToShortlist = async (userId, shortlistedUserId, note) => {
  if (userId === shortlistedUserId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You cannot shortlist yourself');
  }

  try {
    // Check if the user being shortlisted exists
    const userToShortlist = await prisma.user.findUnique({
      where: { id: shortlistedUserId, isActive: true },
    });

    if (!userToShortlist) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'The user you are trying to shortlist does not exist');
    }

    const shortlistEntry = await prisma.shortlist.create({
      data: {
        userId,
        shortlistedUserId,
        note: note || null,
      },
    });
    logger.info(`User ${userId} shortlisted user ${shortlistedUserId}`);
    return shortlistEntry;
  } catch (error) {
    logger.error('Error in addToShortlist:', error);
    if (error.code === 'P2002') { // Unique constraint violation
      throw new ApiError(HTTP_STATUS.CONFLICT, 'This user is already in your shortlist');
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error adding to shortlist');
  }
};

/**
 * Remove a user from the logged-in user's shortlist
 * @param {number} userId - The user doing the removing
 * @param {number} shortlistedUserId - The user being removed
 * @returns {Promise<void>}
 */
export const removeFromShortlist = async (userId, shortlistedUserId) => {
  try {
    const result = await prisma.shortlist.deleteMany({
      where: {
        userId,
        shortlistedUserId,
      },
    });

    if (result.count === 0) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found in your shortlist');
    }

    logger.info(`User ${userId} removed user ${shortlistedUserId} from shortlist`);
  } catch (error) {
    logger.error('Error in removeFromShortlist:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error removing from shortlist');
  }
};

/**
 * Get the logged-in user's shortlist (paginated)
 * @param {number} userId - The user who is requesting their list
 * @param {Object} query - Pagination query params (page, limit)
 * @returns {Promise<Object>} Paginated list of shortlist entries
 */
export const getMyShortlist = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  try {
    const where = { userId };

    const [shortlistEntries, total] = await Promise.all([
      prisma.shortlist.findMany({
        where,
        skip,
        take: limit,
        include: {
          shortlistedUser: { // Get the full profile of the user who was shortlisted
            select: userPublicSelect,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.shortlist.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    // Format the response to be a list of user profiles, not shortlist entries
    const profiles = shortlistEntries.map(entry => ({
      ...entry.shortlistedUser,
      shortlistNote: entry.note, // Optionally include the note
      shortlistedAt: entry.createdAt,
    }));

    return {
      profiles,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getMyShortlist:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving shortlist');
  }
};

export const shortlistService = {
  addToShortlist,
  removeFromShortlist,
  getMyShortlist,
};