import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @param {boolean} includeProfile - Include profile data
 * @returns {Promise<Object>}
 */
export const getUserById = async (userId, includeProfile = true) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: includeProfile,
      },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  } catch (error) {
    logger.error('Error in getUserById:', error);
    throw error;
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>}
 */
export const getUserByEmail = async (email) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  } catch (error) {
    logger.error('Error in getUserByEmail:', error);
    throw error;
  }
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>}
 */
export const updateUser = async (userId, data) => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: { profile: true },
    });

    logger.info(`User updated: ${userId}`);
    return user;
  } catch (error) {
    logger.error('Error in updateUser:', error);
    throw error;
  }
};

/**
 * Delete user (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export const deleteUser = async (userId) => {
  try {
    // Delete user and all related data
    await prisma.$transaction([
      // Delete refresh tokens
      prisma.refreshToken.deleteMany({ where: { userId } }),
      // Delete notifications
      prisma.notification.deleteMany({ where: { userId } }),
      // Delete messages
      prisma.message.deleteMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
      }),
      // Delete matches
      prisma.match.deleteMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
      }),
      // Delete profile
      prisma.profile.deleteMany({ where: { userId } }),
      // Delete user
      prisma.user.delete({ where: { id: userId } }),
    ]);

    logger.info(`User deleted: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error in deleteUser:', error);
    throw error;
  }
};

/**
 * Get all users with pagination
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const getAllUsers = async (query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          profile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      users,
      pagination,
    };
  } catch (error) {
    logger.error('Error in getAllUsers:', error);
    throw error;
  }
};

/**
 * Search users
 * @param {Object} filters - Search filters
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const searchUsers = async (filters, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          profile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      users,
      pagination,
    };
  } catch (error) {
    logger.error('Error in searchUsers:', error);
    throw error;
  }
};

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>}
 */
export const updateUserRole = async (userId, role) => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { profile: true },
    });

    logger.info(`User role updated: ${userId} to ${role}`);
    return user;
  } catch (error) {
    logger.error('Error in updateUserRole:', error);
    throw error;
  }
};

export const userService = {
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  getAllUsers,
  searchUsers,
  updateUserRole,
};
