import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { photoPrivacyService } from '../services/photoPrivacy.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get the privacy settings for a specific photo
 */
export const getMyPhotoSettings = asyncHandler(async (req, res) => {
  const settings = await photoPrivacyService.getPhotoPrivacySettings(
    req.user.id,
    req.params.mediaId
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Photo privacy settings retrieved'
      )
    );
});

/**
 * Update the privacy settings for a specific photo
 */
export const updateMyPhotoSettings = asyncHandler(async (req, res) => {
  const settings = await photoPrivacyService.updatePhotoPrivacySettings(
    req.user.id,
    req.params.mediaId,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Photo privacy settings updated'
      )
    );
});

export const photoPrivacyController = {
  getMyPhotoSettings,
  updateMyPhotoSettings,
};