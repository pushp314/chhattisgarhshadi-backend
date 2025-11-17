import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../config/logger.js';

/**
 * Get the privacy settings for a specific photo.
 * @param {number} userId - The user's ID
 * @param {number} mediaId - The photo's (media) ID
 * @returns {Promise<Object>} The photo privacy settings
 */
export const getPhotoPrivacySettings = async (userId, mediaId) => {
  try {
    const settings = await prisma.photoPrivacySettings.findUnique({
      where: { mediaId },
    });

    if (!settings) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Privacy settings not found for this photo');
    }

    // Security Check: Ensure the user owns this photo
    if (settings.userId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to view these settings');
    }
    
    return settings;
  } catch (error) {
    logger.error('Error in getPhotoPrivacySettings:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving photo privacy settings');
  }
};

/**
 * Update the privacy settings for a specific photo
 * @param {number} userId - The user's ID
 * @param {number} mediaId - The photo's (media) ID
 * @param {Object} data - Validated settings data
 * @returns {Promise<Object>} The updated settings
 */
export const updatePhotoPrivacySettings = async (userId, mediaId, data) => {
  try {
    // First, verify ownership by checking the settings
    const existingSettings = await prisma.photoPrivacySettings.findUnique({
      where: { mediaId },
    });

    if (!existingSettings) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Privacy settings not found for this photo');
    }
    
    if (existingSettings.userId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to update these settings');
    }

    // Now, update the settings
    const updatedSettings = await prisma.photoPrivacySettings.update({
      where: { mediaId },
      data: data,
    });
    
    logger.info(`Photo privacy settings updated for media: ${mediaId} by user: ${userId}`);
    return updatedSettings;
  } catch (error) {
    logger.error('Error in updatePhotoPrivacySettings:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating photo privacy settings');
  }
};

export const photoPrivacyService = {
  getPhotoPrivacySettings,
  updatePhotoPrivacySettings,
};