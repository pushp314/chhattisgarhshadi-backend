import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { userService } from '../services/user.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, user, 'User retrieved successfully')
  );
});

/**
 * Get current user profile
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, user, 'Profile retrieved successfully')
  );
});

/**
 * Update current user
 */
export const updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const user = await userService.updateUser(req.user.id, { name });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, user, 'Profile updated successfully')
  );
});

/**
 * Delete current user
 */
export const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.user.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Account deleted successfully')
  );
});

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
 * Search users
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const result = await userService.searchUsers(req.query, req.query);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Users retrieved successfully')
  );
});

export const userController = {
  getUserById,
  getMyProfile,
  updateMe,
  deleteMe,
  getAllUsers,
  searchUsers,
};
