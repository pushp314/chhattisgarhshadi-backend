import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { profileService } from '../services/profile.service.js';
import matchingAlgorithmService from '../services/matchingAlgorithm.service.js';
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
  // Convert userId to integer (route params are always strings)
  const userId = parseInt(req.params.userId, 10);
  const profile = await profileService.getProfileByUserId(userId, req.user?.id);
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
  // Convert mediaId to integer (route params are always strings)
  const mediaId = parseInt(req.params.mediaId, 10);
  await profileService.deletePhoto(req.user.id, mediaId);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, 'Photo deleted successfully'));
});

/**
 * Get Recommendations (Algorithm)
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await matchingAlgorithmService.getDailyRecommendations(req.user.id, 20);

  // Transform to match profile list structure, extracting profile and adding score
  const profiles = recommendations.map(rec => ({
    ...rec.profile,
    matchScore: rec.score,
    matchLabel: rec.compatibility,
    isSuperMatch: rec.isSuperMatch
  }));

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, {
      profiles,
      pagination: {
        total: profiles.length,
        pages: 1,
        current: 1,
        limit: 20
      }
    }, 'Recommendations retrieved successfully')
  );
});


export const profileController = {
  createProfile,
  getMyProfile,
  getProfileByUserId,
  updateMyProfile,
  deleteMyProfile,
  searchProfiles,
  searchProfiles,
  deletePhoto,
  getRecommendations,
};