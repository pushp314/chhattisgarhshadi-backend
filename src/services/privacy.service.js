import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../config/logger.js';

// --- ProfilePrivacy Helpers (No Change) ---
// (Assuming these are defined or imported)

// --- CommunicationPreferences Helpers (No Change) ---
const communicationArrayFields = ['allowedReligions', 'allowedLocations'];
const processCommDataForSave = (data) => {
  const processedData = { ...data };
  for (const key of communicationArrayFields) {
    if (Array.isArray(processedData[key])) {
      processedData[key] = JSON.stringify(processedData[key]);
    } else if (processedData[key] === null) {
      processedData[key] = '[]';
    }
  }
  return processedData;
};
const parseCommDataAfterFetch = (preference) => {
  if (!preference) return null;
  const parsedPreference = { ...preference };
  for (const key of communicationArrayFields) {
    if (typeof parsedPreference[key] === 'string') {
      try {
        parsedPreference[key] = JSON.parse(parsedPreference[key]);
      } catch (e) {
        logger.warn(`Failed to parse communication preference field '${key}' for userId ${preference.userId}`);
        parsedPreference[key] = [];
      }
    }
  }
  return parsedPreference;
};

// --- SearchVisibility Helpers [NEW] ---
const searchArrayFields = ['excludedCountries'];
const processSearchDataForSave = (data) => {
  const processedData = { ...data };
  for (const key of searchArrayFields) {
    if (Array.isArray(processedData[key])) {
      processedData[key] = JSON.stringify(processedData[key]);
    } else if (processedData[key] === null) {
      processedData[key] = '[]';
    }
  }
  return processedData;
};
const parseSearchDataAfterFetch = (settings) => {
  if (!settings) return null;
  const parsedSettings = { ...settings };
  for (const key of searchArrayFields) {
    if (typeof parsedSettings[key] === 'string') {
      try {
        parsedSettings[key] = JSON.parse(parsedSettings[key]);
      } catch (e) {
        logger.warn(`Failed to parse search visibility field '${key}' for userId ${settings.userId}`);
        parsedSettings[key] = [];
      }
    }
  }
  return parsedSettings;
};


// --- ProfilePrivacy Service (No Change) ---
export const getProfilePrivacy = async (userId) => {
  try {
    let settings = await prisma.profilePrivacySettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      logger.info(`No profile privacy settings found for user ${userId}, creating defaults.`);
      settings = await prisma.profilePrivacySettings.create({ data: { userId } });
    }
    return settings;
  } catch (error) {
    logger.error('Error in getProfilePrivacy:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving privacy settings');
  }
};
export const updateProfilePrivacy = async (userId, data) => {
  try {
    const settings = await prisma.profilePrivacySettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    logger.info(`Profile privacy settings updated for user: ${userId}`);
    return settings;
  } catch (error) {
    logger.error('Error in updateProfilePrivacy:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating privacy settings');
  }
};

// --- CommunicationPreferences Service (No Change) ---
export const getCommunicationPreferences = async (userId) => {
  try {
    let settings = await prisma.communicationPreferences.findUnique({
      where: { userId },
    });
    if (!settings) {
      logger.info(`No communication preferences found for user ${userId}, creating defaults.`);
      settings = await prisma.communicationPreferences.create({ data: { userId } });
    }
    return parseCommDataAfterFetch(settings);
  } catch (error) {
    logger.error('Error in getCommunicationPreferences:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving communication preferences');
  }
};
export const updateCommunicationPreferences = async (userId, data) => {
  const processedData = processCommDataForSave(data);
  try {
    const settings = await prisma.communicationPreferences.upsert({
      where: { userId },
      update: processedData,
      create: { userId, ...processedData },
    });
    logger.info(`Communication preferences updated for user: ${userId}`);
    return parseCommDataAfterFetch(settings);
  } catch (error) {
    logger.error('Error in updateCommunicationPreferences:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating communication preferences');
  }
};

// --- SearchVisibility Service [NEW] ---

/**
 * [NEW] Get a user's search visibility settings.
 * Creates default settings if they don't exist.
 * @param {number} userId - The user's ID
 * @returns {Promise<Object>} The search visibility settings
 */
export const getSearchVisibilitySettings = async (userId) => {
  try {
    let settings = await prisma.searchVisibilitySettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      logger.info(`No search visibility settings found for user ${userId}, creating defaults.`);
      settings = await prisma.searchVisibilitySettings.create({
        data: {
          userId,
          // All fields will use the @default values from schema.prisma
        },
      });
    }
    
    return parseSearchDataAfterFetch(settings);
  } catch (error) {
    logger.error('Error in getSearchVisibilitySettings:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving search settings');
  }
};

/**
 * [NEW] Create or update a user's search visibility settings
 * @param {number} userId - The user's ID
 * @param {Object} data - Validated settings data
 * @returns {Promise<Object>} The updated settings
 */
export const updateSearchVisibilitySettings = async (userId, data) => {
  const processedData = processSearchDataForSave(data);
  try {
    const settings = await prisma.searchVisibilitySettings.upsert({
      where: { userId },
      update: processedData,
      create: {
        userId,
        ...processedData,
      },
    });
    
    logger.info(`Search visibility settings updated for user: ${userId}`);
    return parseSearchDataAfterFetch(settings);
  } catch (error) {
    logger.error('Error in updateSearchVisibilitySettings:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating search settings');
  }
};

export const privacyService = {
  getProfilePrivacy,
  updateProfilePrivacy,
  getCommunicationPreferences,
  updateCommunicationPreferences,
  getSearchVisibilitySettings,    // ADDED
  updateSearchVisibilitySettings, // ADDED
};