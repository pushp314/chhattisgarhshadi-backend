import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { notificationSettingsService } from '../services/notificationSettings.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get the logged-in user's notification preferences
 */
export const getMyNotificationSettings = asyncHandler(async (req, res) => {
  const settings = await notificationSettingsService.getNotificationPreferences(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Notification preferences retrieved successfully'
      )
    );
});

/**
 * Create or update the logged-in user's notification preferences
 */
export const updateMyNotificationSettings = asyncHandler(async (req, res) => {
  const settings = await notificationSettingsService.updateNotificationPreferences(
    req.user.id,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        settings,
        'Notification preferences updated successfully'
      )
    );
});

export const notificationSettingsController = {
  getMyNotificationSettings,
  updateMyNotificationSettings,
};