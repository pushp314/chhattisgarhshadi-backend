import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../config/logger.js';

// --- Helpers for parsing JSON fields ---
const communicationArrayFields = ['allowedReligions', 'allowedLocations'];
const searchArrayFields = ['excludedCountries'];

const processDataForSave = (data, arrayFields) => {
  const processedData = { ...data };
  for (const key of arrayFields) {
    if (Array.isArray(processedData[key])) {
      processedData[key] = JSON.stringify(processedData[key]);
    } else if (processedData[key] === null) {
      processedData[key] = '[]';
    }
  }
  return processedData;
};

const parseDataAfterFetch = (settings, arrayFields) => {
  if (!settings) return null;
  const parsedSettings = { ...settings };
  for (const key of arrayFields) {
    if (typeof parsedSettings[key] === 'string') {
      try {
        parsedSettings[key] = JSON.parse(parsedSettings[key]);
      } catch (e) {
        logger.warn(`Failed to parse settings field '${key}' for userId ${settings.userId}`);
        parsedSettings[key] = [];
      }
    }
  }
  return parsedSettings;
};


// --- ProfilePrivacy Service ---
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

// --- CommunicationPreferences Service ---
export const getCommunicationPreferences = async (userId) => {
  try {
    let settings = await prisma.communicationPreferences.findUnique({
      where: { userId },
    });
    if (!settings) {
      logger.info(`No communication preferences found for user ${userId}, creating defaults.`);
      settings = await prisma.communicationPreferences.create({ data: { userId } });
    }
    return parseDataAfterFetch(settings, communicationArrayFields);
  } catch (error) {
    logger.error('Error in getCommunicationPreferences:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving communication preferences');
  }
};
export const updateCommunicationPreferences = async (userId, data) => {
  const processedData = processDataForSave(data, communicationArrayFields);
  try {
    const settings = await prisma.communicationPreferences.upsert({
      where: { userId },
      update: processedData,
      create: { userId, ...processedData },
    });
    logger.info(`Communication preferences updated for user: ${userId}`);
    return parseDataAfterFetch(settings, communicationArrayFields);
  } catch (error) {
    logger.error('Error in updateCommunicationPreferences:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating communication preferences');
  }
};

// --- SearchVisibility Service ---
export const getSearchVisibilitySettings = async (userId) => {
  try {
    let settings = await prisma.searchVisibilitySettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      logger.info(`No search visibility settings found for user ${userId}, creating defaults.`);
      settings = await prisma.searchVisibilitySettings.create({ data: { userId } });
    }
    return parseDataAfterFetch(settings, searchArrayFields);
  } catch (error) {
    logger.error('Error in getSearchVisibilitySettings:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving search settings');
  }
};
export const updateSearchVisibilitySettings = async (userId, data) => {
  const processedData = processDataForSave(data, searchArrayFields);
  try {
    const settings = await prisma.searchVisibilitySettings.upsert({
      where: { userId },
      update: processedData,
      create: { userId, ...processedData },
    });
    logger.info(`Search visibility settings updated for user: ${userId}`);
    return parseDataAfterFetch(settings, searchArrayFields);
  } catch (error) {
    logger.error('Error in updateSearchVisibilitySettings:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating search settings');
  }
};

// --- AccountSecurity Service [NEW] ---

/**
 * [NEW] Get a user's account security settings.
 * Creates default settings if they don't exist.
 * @param {number} userId - The user's ID
 * @returns {Promise<Object>} The account security settings
 */
export const getAccountSecuritySettings = async (userId) => {
  try {
    let settings = await prisma.accountSecuritySettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      logger.info(`No account security settings found for user ${userId}, creating defaults.`);
      settings = await prisma.accountSecuritySettings.create({
        data: {
          userId,
          // All fields will use the @default values from schema.prisma
        },
      });
    }
    
    // Do not return sensitive fields like twoFactorSecret or backupCodes
    // FIX: Destructure the original field name to an underscore-prefixed variable
    const { twoFactorSecret: _twoFactorSecret, backupCodes: _backupCodes, ...safeSettings } = settings;
    return safeSettings;
  } catch (error) {
    logger.error('Error in getAccountSecuritySettings:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving security settings');
  }
};

/**
 * [NEW] Create or update a user's account security settings
 * @param {number} userId - The user's ID
 * @param {Object} data - Validated settings data
 * @returns {Promise<Object>} The updated settings
 */
export const updateAccountSecuritySettings = async (userId, data) => {
  try {
    // Prevent client from updating sensitive fields
    // FIX: Destructure the original field name to an underscore-prefixed variable
    const { 
      twoFactorSecret: _twoFactorSecret, 
      backupCodes: _backupCodes, 
      recoveryEmailVerified: _recoveryEmailVerified, 
      recoveryPhoneVerified: _recoveryPhoneVerified, 
      ...safeData 
    } = data;

    const settings = await prisma.accountSecuritySettings.upsert({
      where: { userId },
      update: safeData,
      create: {
        userId,
        ...safeData,
      },
    });
    
    logger.info(`Account security settings updated for user: ${userId}`);
    // Do not return sensitive fields
    // FIX: Destructure the original field name to an underscore-prefixed variable
    const { twoFactorSecret: _s, backupCodes: _b, ...safeSettings } = settings;
    return safeSettings;
  } catch (error) {
    logger.error('Error in updateAccountSecuritySettings:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating security settings');
  }
};

export const privacyService = {
  getProfilePrivacy,
  updateProfilePrivacy,
  getCommunicationPreferences,
  updateCommunicationPreferences,
  getSearchVisibilitySettings,
  updateSearchVisibilitySettings,
  getAccountSecuritySettings,     // ADDED
  updateAccountSecuritySettings,  // ADDED
};