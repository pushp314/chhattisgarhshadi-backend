import prisma from '../config/database.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../config/logger.js';

/**
 * Generate and store refresh token
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>}
 */
const storeRefreshToken = async (userId, refreshToken) => {
  // Calculate expiry date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
    },
  });
};

/**
 * Authenticate user via Google OAuth
 * @param {Object} user - User object from Passport
 * @returns {Promise<Object>} User with tokens
 */
export const authenticateWithGoogle = async (user) => {
  try {
    // Generate token pair
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    await storeRefreshToken(user.id, tokens.refreshToken);

    logger.info(`User authenticated: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    logger.error('Error in authenticateWithGoogle:', error);
    throw error;
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token pair
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token expired');
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    // Store new refresh token
    await storeRefreshToken(tokenRecord.user.id, tokens.refreshToken);

    logger.info(`Access token refreshed for user: ${tokenRecord.user.email}`);

    return tokens;
  } catch (error) {
    logger.error('Error in refreshAccessToken:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
  }
};

/**
 * Logout user
 * @param {string} refreshToken - Refresh token to invalidate
 * @returns {Promise<void>}
 */
export const logout = async (refreshToken) => {
  try {
    if (!refreshToken) {
      return;
    }

    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    logger.info('User logged out successfully');
  } catch (error) {
    logger.error('Error in logout:', error);
    throw error;
  }
};

/**
 * Logout user from all devices
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const logoutAllDevices = async (userId) => {
  try {
    // Delete all refresh tokens for user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info(`User logged out from all devices: ${userId}`);
  } catch (error) {
    logger.error('Error in logoutAllDevices:', error);
    throw error;
  }
};

/**
 * Clean up expired refresh tokens
 * @returns {Promise<number>} Number of tokens deleted
 */
export const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired tokens`);
    return result.count;
  } catch (error) {
    logger.error('Error in cleanupExpiredTokens:', error);
    throw error;
  }
};

export const authService = {
  authenticateWithGoogle,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  cleanupExpiredTokens,
};
