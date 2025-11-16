import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { profileService } from '../services/profile.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants.js';

/**
 * Create profile
 */
export const createProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.createProfile(req.user.id, req.body);
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        profile,
        SUCCESS_MESSAGES.PROFILE_CREATED
      )
    );
});

/**
 * Get my profile
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfileByUserId(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, profile, 'Profile retrieved successfully'));
});

/**
 * Get profile by user ID
 */
export const getProfileByUserId = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfileByUserId(req.params.userId);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, profile, 'Profile retrieved successfully'));
});

/**
 * Update my profile
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  // req.body is now pre-validated and safe
  const profile = await profileService.updateProfile(req.user.id, req.body);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, profile, SUCCESS_MESSAGES.PROFILE_UPDATED)
    );
});

/**
 * Delete my profile
 */
export const deleteMyProfile = asyncHandler(async (req, res) => {
  await profileService.deleteProfile(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, 'Profile deleted successfully'));
});

/**
 * Search profiles
 */
export const searchProfiles = asyncHandler(async (req, res) => {
  // FIX: Pass req.user.id to the service so it can filter blocked users
  const result = await profileService.searchProfiles(req.query, req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, result, 'Profiles retrieved successfully'));
});

/**
 * Delete a photo
 */
export const deletePhoto = asyncHandler(async (req, res) => {
  await profileService.deletePhoto(req.user.id, req.params.mediaId);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, 'Photo deleted successfully'));
});


export const profileController = {
  createProfile,
  getMyProfile,
  getProfileByUserId,
  updateMyProfile,
  deleteMyProfile,
  searchProfiles,
  deletePhoto, // Replaced add/remove with a secure delete
};