import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
// ADDED: Import the blockService
import { blockService } from './block.service.js';

// Define a reusable Prisma select for public-facing user data
// This prevents leaking sensitive fields like email, phone, googleId, etc.
const userPublicSelect = {
  id: true,
  profilePicture: true,
  role: true,
  preferredLanguage: true,
  createdAt: true,
  profile: true, // Include the full related profile
};

/**
 * Get a user's full details (for the user themselves OR ADMIN)
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export const getFullUserById = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        profile: true,
        // --- ADDED: Include agent name for admin panel ---
        agent: {
          select: {
            agentCode: true,
            agentName: true,
          },
        },
        // --- End of Add ---
      },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    // It's safe to return the full user object here because
    // it's only called by getMyProfile (for the user themselves)
    // or by an admin (who is allowed to see this)
    return user;
  } catch (error) {
    logger.error('Error in getFullUserById:', error);
    if (!(error instanceof ApiError)) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving user data');
    }
    throw error;
  }
};

/**
 * Get another user's public-safe details
 * @param {number} userId - ID of the user to get
 * @param {number} currentUserId - ID of the user making the request
 * @returns {Promise<Object>}
 */
export const getPublicUserById = async (userId, currentUserId) => {
  try {
    // --- Block Check [ADDED] ---
    if (currentUserId && userId !== currentUserId) {
      const blockedIdSet = await blockService.getAllBlockedUserIds(currentUserId);
      // Check if the user being requested is in the block list
      if (blockedIdSet.has(userId)) {
        // Obscure the reason - just say they don't exist
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }
    }
    // --- End Block Check ---

    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: userPublicSelect, // Use the public-safe select
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  } catch (error) {
    logger.error('Error in getPublicUserById:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving user data');
  }
};

/**
 * Update a user's safe, editable fields
 * @param {string} userId - User ID
 * @param {Object} data - Update data (pre-validated)
 * @returns {Promise<Object>}
 */
export const updateUser = async (userId, data) => {
  try {
    // We only pass validated data, so fields like 'role' cannot be injected
    const user = await prisma.user.update({
      where: { id: userId },
      data: data, // data is already validated by Zod schema in the route
      include: { profile: true },
    });

    logger.info(`User updated: ${userId}`);
    return user; // Return full user object to the user who made the change
  } catch (error) {
    logger.error('Error in updateUser:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating user');
  }
};

/**
 * Soft delete a user's account
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export const deleteUser = async (userId) => {
  try {
    // This performs a SOFT DELETE by setting isActive to false
    // and setting deletedAt. This is reversible and safer.
    // It also anonymizes PII.
    await prisma.$transaction([
      // 1. Mark user as inactive and set deletedAt
      prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          isBanned: true, // Prevents login
          banReason: 'Account deleted by user.',
          deletedAt: new Date(),
          email: `deleted_${userId}@chhattisgarhshadi.com`, // Anonymize email
          googleId: `deleted_${userId}`, // Anonymize googleId
          phone: null,
          profilePicture: null,
          deviceInfo: null,
          lastLoginIp: null,
        },
      }),
      // 2. Revoke all refresh tokens
      prisma.refreshToken.deleteMany({ where: { userId } }),
      // 3. (Optional) You may want to also delete their profile or keep it
      //    Leaving it for now, as isActive=false will hide it.
      // prisma.profile.deleteMany({ where: { userId } }),
    ]);

    logger.info(`User soft-deleted: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error in deleteUser:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting account');
  }
};

/**
 * Search users (public, paginated)
 * @param {Object} query - Query parameters (pre-validated)
 * @param {number} [currentUserId] - The ID of the user performing the search (optional)
 * @returns {Promise<Object>}
 */
export const searchUsers = async (query, currentUserId = null) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);
    const { search, role } = query;

    const where = {
      isActive: true, // Only show active users
    };

    // --- Block Check [ADDED] ---
    if (currentUserId) {
      const blockedIds = Array.from(await blockService.getAllBlockedUserIds(currentUserId));
      blockedIds.push(currentUserId); // Add self to block list
      
      where.id = { notIn: blockedIds };
    }
    // --- End Block Check ---

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        // Search on profile fields, not sensitive User fields
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { profile: { profileId: { equals: search } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: userPublicSelect, // Use public-safe select
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
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error searching users');
  }
};

/**
 * [NEW] Register or update an FCM token for a device
 * @param {number} userId - The user's ID
 * @param {Object} data - Validated token data
 * @returns {Promise<Object>} The created/updated FcmToken
 */
export const registerFcmToken = async (userId, data) => {
  const { token, deviceId, deviceType, deviceName } = data;

  try {
    // Upsert ensures that one user+deviceId pair is unique
    // It updates the token if the deviceId already exists
    const fcmToken = await prisma.fcmToken.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      update: {
        token, // Update the token
        deviceName: deviceName || null,
        isActive: true, // Mark as active
        lastUsedAt: new Date(), // Update timestamp
      },
      create: {
        userId,
        token,
        deviceId,
        deviceType,
        deviceName: deviceName || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });

    logger.info(`FCM token registered for user ${userId} on device ${deviceId}`);
    return fcmToken;
  } catch (error) {
    logger.error('Error in registerFcmToken:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error registering FCM token');
  }
};

// Admin-specific functions (moved from the original service)
/**
 * Get all users with pagination (Admin Only)
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
          // --- ADDED: Include agent name for admin panel ---
          agent: {
            select: {
              agentCode: true,
              agentName: true,
            },
          },
          // --- End of Add ---
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      users, // Admin gets full object, this is acceptable
      pagination,
    };
  } catch (error) {
    logger.error('Error in getAllUsers:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving users');
  }
};

/**
 * Update user role (Admin Only)
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>}
 */
export const updateUserRole = async (userId, role) => {
  try {
    // Add validation to ensure 'role' is a valid UserRole
    if (!Object.values(USER_ROLES).includes(role)) {
       throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid user role');
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { profile: true },
    });

    logger.info(`User role updated: ${userId} to ${role}`);
    return user;
  } catch (error) {
    logger.error('Error in updateUserRole:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating user role');
  }
};

export const userService = {
  getFullUserById,
  getPublicUserById,
  updateUser,
  deleteUser,
  searchUsers,
  registerFcmToken,
  // Admin functions
  getAllUsers,
  updateUserRole,
};