import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { userService } from '../services/user.service.js';
import { profileService } from '../services/profile.service.js';
import { adminService } from '../services/admin.service.js'; 
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get all users (Admin)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, result, 'Users retrieved successfully'));
});

/**
 * Get user by ID (Admin)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getFullUserById(req.params.userId);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, user, 'User retrieved successfully'));
});

/**
 * Update user role (Admin)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { userId } = req.params;

  const user = await userService.updateUserRole(userId, role);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, user, 'User role updated successfully'));
});

/**
 * Delete user (Admin)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.userId);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, 'User deleted successfully'));
});

/**
 * Get all profiles (Admin)
 */
export const getAllProfiles = asyncHandler(async (req, res) => {
  // Pass `null` for currentUserId to skip block checks for admin
  const result = await profileService.searchProfiles(req.query, null);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, result, 'Profiles retrieved successfully'));
});

/**
 * Get dashboard statistics (Admin)
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        stats,
        'Dashboard statistics retrieved successfully'
      )
    );
});

/**
 * Clean up expired tokens (Admin)
 */
export const cleanupExpiredTokens = asyncHandler(async (req, res) => {
  const count = await adminService.cleanupExpiredTokens();
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, { count }, `${count} expired tokens cleaned up`)
    );
});

/**
 * Get recent users (Admin)
 */
export const getRecentUsers = asyncHandler(async (req, res) => {
  const limit = req.query.limit;
  const users = await adminService.getRecentUsers(limit);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, users, 'Recent users retrieved successfully'));
});

/**
 * Get recent matches (Admin)
 */
export const getRecentMatches = asyncHandler(async (req, res) => {
  const limit = req.query.limit;
  const matches = await adminService.getRecentMatches(limit);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, matches, 'Recent matches retrieved successfully')
    );
});

// --- ADDED FOR REPORTS ---

/**
 * [NEW] Get all reports (Admin)
 */
export const getReports = asyncHandler(async (req, res) => {
  const result = await adminService.getReports(req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, result, 'Reports retrieved successfully'));
});

/**
 * [NEW] Get a single report by ID (Admin)
 */
export const getReportById = asyncHandler(async (req, res) => {
  const report = await adminService.getReportById(req.params.id);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, report, 'Report retrieved successfully'));
});

/**
 * [NEW] Update a report's status (Admin)
 */
export const updateReport = asyncHandler(async (req, res) => {
  const updatedReport = await adminService.updateReportStatus(
    req.params.id,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, updatedReport, 'Report updated successfully'));
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
  getReports,     // ADDED
  getReportById,  // ADDED
  updateReport,   // ADDED
};