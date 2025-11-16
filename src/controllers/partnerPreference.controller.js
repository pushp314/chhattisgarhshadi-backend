import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { partnerPreferenceService } from '../services/partnerPreference.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get the logged-in user's partner preferences
 */
export const getMyPreference = asyncHandler(async (req, res) => {
  const preference = await partnerPreferenceService.getMyPreference(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        preference,
        'Partner preferences retrieved successfully'
      )
    );
});

/**
 * Create or update the logged-in user's partner preferences
 */
export const upsertMyPreference = asyncHandler(async (req, res) => {
  const preference = await partnerPreferenceService.upsertMyPreference(
    req.user.id,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        preference,
        'Partner preferences updated successfully'
      )
    );
});

export const partnerPreferenceController = {
  getMyPreference,
  upsertMyPreference,
};