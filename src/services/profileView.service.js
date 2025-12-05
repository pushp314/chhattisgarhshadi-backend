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
    // --- Check User Subscription Status ---
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE', endDate: { gt: new Date() } },
          take: 1,
        },
        profile: { select: { firstName: true, lastName: true } },
      },
    });

    const isPremium = viewer?.subscriptions?.length > 0 || viewer?.role === 'PREMIUM_USER';

    // --- Free User Daily Limit Check ---
    if (!isPremium) {
      const FREE_DAILY_VIEW_LIMIT = 10;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const viewsToday = await prisma.profileView.count({
        where: {
          viewerId,
          viewedAt: { gte: startOfDay },
        },
      });

      if (viewsToday >= FREE_DAILY_VIEW_LIMIT) {
        throw new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Free users can view only ${FREE_DAILY_VIEW_LIMIT} profiles per day. Upgrade to Premium for unlimited profile views.`
        );
      }
    }
    // --- End Daily Limit Check ---

    // --- Block Check ---
    const blockedIdSet = await blockService.getAllBlockedUserIds(viewerId);
    if (blockedIdSet.has(profileId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot interact with this user');
    }

    // --- Spam Prevention Check (1 view per profile per 24 hours) ---
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
      return { ...existingView, alreadyViewed: true }; // View already logged, return without counting
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

    // Return remaining views for free users
    if (!isPremium) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const viewsToday = await prisma.profileView.count({
        where: { viewerId, viewedAt: { gte: startOfDay } },
      });
      return { ...newView, remainingViews: FREE_DAILY_VIEW_LIMIT - viewsToday };
    }

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
    // --- Check User Subscription Status ---
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE', endDate: { gt: new Date() } },
          take: 1,
        },
      },
    });

    const isPremium = user?.subscriptions?.length > 0 || user?.role === 'PREMIUM_USER';
    const FREE_VIEW_LIMIT = 2; // Free users can only see last 2 viewers

    const blockedIdSet = await blockService.getAllBlockedUserIds(userId);
    const blockedIds = Array.from(blockedIdSet);

    const where = {
      profileId: userId,
      isAnonymous: false,
      viewerId: { notIn: blockedIds },
    };

    // Get total count first
    const total = await prisma.profileView.count({ where });

    // For free users, limit to 2 most recent
    const effectiveLimit = isPremium ? limit : Math.min(limit, FREE_VIEW_LIMIT);
    const effectiveSkip = isPremium ? skip : 0; // Free users always start from beginning

    const views = await prisma.profileView.findMany({
      where,
      skip: effectiveSkip,
      take: effectiveLimit,
      include: {
        viewer: {
          select: userPublicSelect,
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });

    // For free users, show limited pagination info
    const pagination = isPremium
      ? getPaginationMetadata(page, limit, total)
      : {
        page: 1,
        limit: FREE_VIEW_LIMIT,
        total: Math.min(total, FREE_VIEW_LIMIT),
        totalPages: 1,
        hiddenCount: Math.max(0, total - FREE_VIEW_LIMIT), // How many are hidden
      };

    const profiles = views.map(view => ({
      ...view.viewer,
      viewedAt: view.viewedAt,
    }));

    return {
      profiles,
      pagination,
      isPremium, // Let frontend know if user is premium
      totalViewers: total, // Total viewers (even if not all shown)
      message: !isPremium && total > FREE_VIEW_LIMIT
        ? `Upgrade to Premium to see all ${total} profile viewers`
        : null,
    };
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