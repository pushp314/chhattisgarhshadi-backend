import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
import { blockService } from './block.service.js';
import { notificationService } from './notification.service.js';

// Reusable select for public user data
const userPublicSelect = {
  id: true,
  profilePicture: true,
  role: true,
  preferredLanguage: true,
  profile: true,
};

/**
 * Log that a user has viewed another user's profile
 * @param {number} viewerId - The user viewing the profile
 * @param {number} profileId - The userId of the profile being viewed
 * @param {boolean} isAnonymous - If the view is anonymous
 * @returns {Promise<Object>} The new or existing profile view entry
 */
export const logProfileView = async (viewerId, profileId, isAnonymous = false) => {
  if (viewerId === profileId) {
    // Don't log self-views
    return { message: 'Cannot view your own profile' };
  }

  try {
    // --- Block Check ---
    const blockedIdSet = await blockService.getAllBlockedUserIds(viewerId);
    if (blockedIdSet.has(profileId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot interact with this user');
    }

    // --- Spam Prevention Check (1 view per 24 hours) ---
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingView = await prisma.profileView.findFirst({
      where: {
        viewerId,
        profileId,
        viewedAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    if (existingView) {
      logger.info(`Profile view already logged within 24h for ${viewerId} -> ${profileId}`);
      return existingView; // View already logged, do nothing
    }
    
    // --- Create New View Log ---
    const newView = await prisma.profileView.create({
      data: {
        viewerId,
        profileId,
        isAnonymous,
      },
    });
    
    // --- Send Notification (if not anonymous) ---
    if (!isAnonymous) {
      const viewer = await prisma.user.findUnique({
          where: { id: viewerId },
          select: { profile: { select: { firstName: true, lastName: true }}}
      });
      
      const viewerName = viewer?.profile?.firstName || 'Someone';

      await notificationService.createNotification({
        userId: profileId,
        type: NOTIFICATION_TYPES.PROFILE_VIEWED,
        title: 'Your profile has a new view!',
        message: `${viewerName} viewed your profile.`,
        data: { viewerId },
      });
    }

    logger.info(`Profile view logged: ${viewerId} -> ${profileId}`);
    return newView;

  } catch (error) {
    logger.error('Error in logProfileView:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error logging profile view');
  }
};

/**
 * Get list of users who viewed the current user's profile
 * @param {number} userId - The user asking "who viewed me"
 * @param {Object} query - Pagination query
 * @returns {Promise<Object>} Paginated list of users
 */
export const getWhoViewedMe = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  try {
    const blockedIdSet = await blockService.getAllBlockedUserIds(userId);
    const blockedIds = Array.from(blockedIdSet);

    const where = {
      profileId: userId,
      isAnonymous: false, // Don't show anonymous views
      viewerId: { notIn: blockedIds }, // Don't show views from blocked users
    };

    const [views, total] = await Promise.all([
      prisma.profileView.findMany({
        where,
        skip,
        take: limit,
        include: {
          viewer: { // 'viewer' is the relation to the User who viewed
            select: userPublicSelect,
          },
        },
        orderBy: {
          viewedAt: 'desc',
        },
      }),
      prisma.profileView.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);
    
    // Format response to be a list of user profiles
    const profiles = views.map(view => ({
      ...view.viewer,
      viewedAt: view.viewedAt,
    }));

    return { profiles, pagination };
  } catch (error) {
    logger.error('Error in getWhoViewedMe:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving profile views');
  }
};

/**
 * Get list of profiles the current user has viewed
 * @param {number} userId - The user asking "who did I view"
 * @param {Object} query - Pagination query
 * @returns {Promise<Object>} Paginated list of users
 */
export const getMyViewHistory = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  try {
    const blockedIdSet = await blockService.getAllBlockedUserIds(userId);
    const blockedIds = Array.from(blockedIdSet);
    
    const where = {
      viewerId: userId,
      profileId: { notIn: blockedIds }, // Don't show blocked users in history
    };

    const [views, total] = await Promise.all([
      prisma.profileView.findMany({
        where,
        skip,
        take: limit,
        include: {
          profile: { // 'profile' is the relation to the User who was viewed
            select: userPublicSelect,
          },
        },
        orderBy: {
          viewedAt: 'desc',
        },
      }),
      prisma.profileView.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    // Format response to be a list of user profiles
    const profiles = views.map(view => ({
      ...view.profile,
      viewedAt: view.viewedAt,
      isAnonymous: view.isAnonymous, // Show if *my* view was anonymous
    }));

    return { profiles, pagination };
  } catch (error) {
    logger.error('Error in getMyViewHistory:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving view history');
  }
};

export const profileViewService = {
  logProfileView,
  getWhoViewedMe,
  getMyViewHistory,
};