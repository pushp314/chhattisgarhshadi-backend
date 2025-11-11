import prisma from '../config/database.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  try {
    // FIX: Use correct model names 'matchRequest' and 'payments'
    const [
      totalUsers,
      totalProfiles,
      totalMatches,
      totalMessages,
      totalPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.matchRequest.count(), // <-- FIXED
      prisma.message.count(),
      prisma.payments.count(), // <-- FIXED
    ]);

    return {
      totalUsers,
      totalProfiles,
      totalMatches,
      totalMessages,
      totalPayments,
    };
  } catch (error) {
    logger.error('Error in getDashboardStats:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve dashboard stats'
    );
  }
};

/**
 * Clean up expired refresh tokens
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    logger.info(`Admin cleanup: ${result.count} expired tokens deleted.`);
    return result.count;
  } catch (error) {
    logger.error('Error in cleanupExpiredTokens:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to clean up tokens'
    );
  }
};

/**
 * Get recent users
 */
const getRecentUsers = async (limit = 10) => {
  try {
    return await prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        profile: true,
      },
    });
  } catch (error) {
    logger.error('Error in getRecentUsers:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve recent users'
    );
  }
};

/**
 * Get recent matches
 */
const getRecentMatches = async (limit = 10) => {
  try {
    // FIX: Use correct model name 'matchRequest' and relations 'sender'/'receiver'
    return await prisma.matchRequest.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          include: { profile: true },
        },
        receiver: {
          include: { profile: true },
        },
      },
    });
  } catch (error) {
    logger.error('Error in getRecentMatches:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve recent matches'
    );
  }
};

export const adminService = {
  getDashboardStats,
  cleanupExpiredTokens,
  getRecentUsers,
  getRecentMatches,
};