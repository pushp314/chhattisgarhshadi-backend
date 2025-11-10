import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { userService } from '../services/user.service.js';
import { profileService } from '../services/profile.service.js';
import { authService } from '../services/auth.service.js';
import prisma from '../config/database.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get all users (Admin)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Users retrieved successfully')
  );
});

/**
 * Get user by ID (Admin)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, user, 'User retrieved successfully')
  );
});

/**
 * Update user role (Admin)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await userService.updateUserRole(req.params.userId, role);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, user, 'User role updated successfully')
  );
});

/**
 * Delete user (Admin)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.userId);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'User deleted successfully')
  );
});

/**
 * Get all profiles (Admin)
 */
export const getAllProfiles = asyncHandler(async (req, res) => {
  const result = await profileService.searchProfiles({}, req.query);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Profiles retrieved successfully')
  );
});

/**
 * Get dashboard statistics (Admin)
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProfiles,
    totalMatches,
    totalMessages,
    totalPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count(),
    prisma.match.count(),
    prisma.message.count(),
    prisma.payment.count(),
  ]);

  const stats = {
    totalUsers,
    totalProfiles,
    totalMatches,
    totalMessages,
    totalPayments,
  };

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, stats, 'Dashboard statistics retrieved successfully')
  );
});

/**
 * Clean up expired tokens (Admin)
 */
export const cleanupExpiredTokens = asyncHandler(async (req, res) => {
  const count = await authService.cleanupExpiredTokens();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { count }, `${count} expired tokens cleaned up`)
  );
});

/**
 * Get recent users (Admin)
 */
export const getRecentUsers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const users = await prisma.user.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      profile: true,
    },
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, users, 'Recent users retrieved successfully')
  );
});

/**
 * Get recent matches (Admin)
 */
export const getRecentMatches = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const matches = await prisma.match.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc',
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

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, matches, 'Recent matches retrieved successfully')
  );
});

export const adminController = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllProfiles,
  getDashboardStats,
  cleanupExpiredTokens,
  getRecentUsers,
  getRecentMatches,
};
