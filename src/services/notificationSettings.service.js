import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../config/logger.js';

/**
 * Get a user's notification preferences.
 * Creates default preferences if they don't exist.
 * @param {number} userId - The user's ID
 * @returns {Promise<Object>} The notification preferences
 */
export const getNotificationPreferences = async (userId) => {
  try {
    let settings = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    // If settings don't exist, create them with schema defaults
    if (!settings) {
      logger.info(`No notification preferences found for user ${userId}, creating defaults.`);
      settings = await prisma.notificationPreferences.create({
        data: {
          userId,
          // All fields will use the @default values from schema.prisma
        },
      });
    }
    
    return settings;
  } catch (error) {
    logger.error('Error in getNotificationPreferences:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving notification preferences');
  }
};

/**
 * Create or update a user's notification preferences
 * @param {number} userId - The user's ID
 * @param {Object} data - Validated settings data
 * @returns {Promise<Object>} The updated settings
 */
export const updateNotificationPreferences = async (userId, data) => {
  try {
    const settings = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
    
    logger.info(`Notification preferences updated for user: ${userId}`);
    return settings;
  } catch (error) {
    logger.error('Error in updateNotificationPreferences:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating notification preferences');
  }
};

export const notificationSettingsService = {
  getNotificationPreferences,
  updateNotificationPreferences,
};