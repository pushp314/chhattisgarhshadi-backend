import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { privacyService } from '../services/privacy.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

// --- ProfilePrivacy (No Change) ---
export const getMyProfilePrivacy = asyncHandler(async (req, res) => {
  const settings = await privacyService.getProfilePrivacy(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Profile privacy settings retrieved successfully'
      )
    );
});
export const updateMyProfilePrivacy = asyncHandler(async (req, res) => {
  const settings = await privacyService.updateProfilePrivacy(
    req.user.id,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Profile privacy settings updated successfully'
      )
    );
});

// --- CommunicationPreferences (No Change) ---
export const getMyCommunicationSettings = asyncHandler(async (req, res) => {
  const settings = await privacyService.getCommunicationPreferences(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Communication preferences retrieved successfully'
      )
    );
});
export const updateMyCommunicationSettings = asyncHandler(async (req, res) => {
  const settings = await privacyService.updateCommunicationPreferences(
    req.user.id,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Communication preferences updated successfully'
      )
    );
});

// --- SearchVisibility [NEW] ---

/**
 * [NEW] Get the logged-in user's search visibility settings
 */
export const getMySearchVisibilitySettings = asyncHandler(async (req, res) => {
  const settings = await privacyService.getSearchVisibilitySettings(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Search visibility settings retrieved successfully'
      )
    );
});

/**
 * [NEW] Create or update the logged-in user's search visibility settings
 */
export const updateMySearchVisibilitySettings = asyncHandler(async (req, res) => {
  const settings = await privacyService.updateSearchVisibilitySettings(
    req.user.id,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Search visibility settings updated successfully'
      )
    );
});


export const privacyController = {
  getMyProfilePrivacy,
  updateMyProfilePrivacy,
  getMyCommunicationSettings,
  updateMyCommunicationSettings,
  getMySearchVisibilitySettings,    // ADDED
  updateMySearchVisibilitySettings, // ADDED
};