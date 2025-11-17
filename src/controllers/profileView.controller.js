import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { profileViewService } from '../services/profileView.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Log that the current user viewed another profile
 */
export const logProfileView = asyncHandler(async (req, res) => {
  const { profileId, isAnonymous } = req.body;
  const result = await profileViewService.logProfileView(
    req.user.id,
    profileId,
    isAnonymous
  );
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        result,
        'Profile view logged successfully'
      )
    );
});

/**
 * Get the list of users who viewed the current user's profile
 */
export const getWhoViewedMe = asyncHandler(async (req, res) => {
  const result = await profileViewService.getWhoViewedMe(req.user.id, req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Profile views retrieved successfully')
    );
});

/**
 * Get the list of profiles the current user has viewed
 */
export const getMyViewHistory = asyncHandler(async (req, res) => {
  const result = await profileViewService.getMyViewHistory(req.user.id, req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'View history retrieved successfully')
    );
});

export const profileViewController = {
  logProfileView,
  getWhoViewedMe,
  getMyViewHistory,
};