import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { userService } from '../services/user.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get another user's public profile by ID
 */
export const getUserById = asyncHandler(async (req, res) => {
  // Use the new service function for public data
  const user = await userService.getPublicUserById(req.params.id);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, user, 'User retrieved successfully'));
});

/**
 * Get the currently authenticated user's full profile
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  // Use the service function that returns full data for the logged-in user
  const user = await userService.getFullUserById(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, user, 'Profile retrieved successfully'));
});

/**
 * Update the current user's profile
 */
export const updateMe = asyncHandler(async (req, res) => {
  // req.body is now pre-validated by Zod, so it's safe to pass
  const user = await userService.updateUser(req.user.id, req.body);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, user, 'Profile updated successfully'));
});

/**
 * Delete (soft) the current user's account
 */
export const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, 'Account deactivated successfully'));
});

/**
 * Search for other users (public, paginated)
 */
export const searchUsers = asyncHandler(async (req, res) => {
  // Pass the validated query object to the service
  const result = await userService.searchUsers(req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, result, 'Users retrieved successfully'));
});

export const userController = {
  getUserById,
  getMyProfile,
  updateMe,
  deleteMe,
  searchUsers,
};