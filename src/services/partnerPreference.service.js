import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../config/logger.js';

// Fields that are stored as JSON arrays in the database
const arrayTextFields = [
  'religion', 'caste', 'motherTongue', 'maritalStatus', 
  'country', 'state', 'city', 'residencyStatus', 
  'nativeDistrict', 'education', 'occupation', 'diet'
];

/**
 * Get the profileId for a given userId.
 * @param {number} userId - The user's ID
 * @returns {Promise<number>} The user's profile ID
 */
const getProfileId = async (userId) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROFILE_NOT_FOUND);
  }
  return profile.id;
};

/**
 * Helper to stringify array fields for Prisma
 */
const processDataForSave = (data) => {
  const processedData = { ...data };
  for (const key of arrayTextFields) {
    if (Array.isArray(processedData[key])) {
      processedData[key] = JSON.stringify(processedData[key]);
    } else if (processedData[key] === null) {
      processedData[key] = '[]'; // Store empty array as string
    }
  }
  return processedData;
};

/**
 * Helper to parse JSON array fields from Prisma
 */
const parseDataAfterFetch = (preference) => {
  if (!preference) return null;
  const parsedPreference = { ...preference };
  for (const key of arrayTextFields) {
    if (typeof parsedPreference[key] === 'string') {
      try {
        parsedPreference[key] = JSON.parse(parsedPreference[key]);
      } catch (e) {
        logger.warn(`Failed to parse partner preference field '${key}' for profileId ${preference.profileId}`);
        parsedPreference[key] = []; // Default to empty array on parse error
      }
    }
  }
  return parsedPreference;
};

/**
 * Get a user's partner preferences
 * @param {number} userId - The user's ID
 * @returns {Promise<Object|null>} The partner preference object
 */
export const getMyPreference = async (userId) => {
  const profileId = await getProfileId(userId);
  try {
    const preference = await prisma.partnerPreference.findUnique({
      where: { profileId },
    });
    return parseDataAfterFetch(preference);
  } catch (error) {
    logger.error('Error in getMyPreference:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving preferences');
  }
};

/**
 * Create or update a user's partner preferences
 * @param {number} userId - The user's ID
 * @param {Object} data - Validated preference data
 * @returns {Promise<Object>} The upserted partner preference object
 */
export const upsertMyPreference = async (userId, data) => {
  const profileId = await getProfileId(userId);
  const processedData = processDataForSave(data);

  try {
    const preference = await prisma.partnerPreference.upsert({
      where: { profileId },
      update: processedData,
      create: {
        profileId,
        ...processedData,
      },
    });
    logger.info(`Partner preferences updated for user: ${userId}`);
    return parseDataAfterFetch(preference);
  } catch (error) {
    logger.error('Error in upsertMyPreference:', error);
    if (error.code === 'P2002') { // Should be handled by upsert, but as a fallback
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Preferences already exist');
    }
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating preferences');
  }
};

export const partnerPreferenceService = {
  getMyPreference,
  upsertMyPreference,
};