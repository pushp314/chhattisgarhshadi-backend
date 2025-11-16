import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../config/logger.js';

/**
 * Get the profileId for a given userId.
 * Throws an error if the profile does not exist.
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
 * Create a new occupation entry for a user
 * @param {number} userId - The user's ID
 * @param {Object} data - Validated occupation data
 * @returns {Promise<Object>} The created occupation entry
 */
export const createOccupation = async (userId, data) => {
  const profileId = await getProfileId(userId);

  try {
    const occupation = await prisma.occupation.create({
      data: {
        profileId: profileId,
        ...data,
      },
    });
    logger.info(`Occupation entry created for user: ${userId}`);
    return occupation;
  } catch (error) {
    logger.error('Error in createOccupation:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error adding occupation');
  }
};

/**
 * Get all occupation entries for a user
 * @param {number} userId - The user's ID
 * @returns {Promise<Array>} A list of occupation entries
 */
export const getMyOccupations = async (userId) => {
  const profileId = await getProfileId(userId);

  try {
    return await prisma.occupation.findMany({
      where: { profileId },
      orderBy: {
        isCurrent: 'desc', // Show current job first
      },
    });
  } catch (error) {
    logger.error('Error in getMyOccupations:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving occupations');
  }
};

/**
 * Update a specific occupation entry
 * @param {number} userId - The user's ID
 * @param {number} occupationId - The ID of the occupation entry to update
 * @param {Object} data - Validated update data
 * @returns {Promise<Object>} The updated occupation entry
 */
export const updateOccupation = async (userId, occupationId, data) => {
  const profileId = await getProfileId(userId);

  try {
    const occupation = await prisma.occupation.findUnique({
      where: { id: occupationId },
    });

    if (!occupation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Occupation entry not found');
    }

    // Security Check: Ensure the user owns this occupation entry
    if (occupation.profileId !== profileId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to update this entry');
    }

    const updatedOccupation = await prisma.occupation.update({
      where: { id: occupationId },
      data: data,
    });
    
    logger.info(`Occupation entry ${occupationId} updated for user: ${userId}`);
    return updatedOccupation;
  } catch (error) {
    logger.error('Error in updateOccupation:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating occupation');
  }
};

/**
 * Delete a specific occupation entry
 * @param {number} userId - The user's ID
 * @param {number} occupationId - The ID of the occupation entry to delete
 * @returns {Promise<void>}
 */
export const deleteOccupation = async (userId, occupationId) => {
  const profileId = await getProfileId(userId);

  try {
    const occupation = await prisma.occupation.findUnique({
      where: { id: occupationId },
    });

    if (!occupation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Occupation entry not found');
    }

    // Security Check: Ensure the user owns this occupation entry
    if (occupation.profileId !== profileId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to delete this entry');
    }

    await prisma.occupation.delete({
      where: { id: occupationId },
    });

    logger.info(`Occupation entry ${occupationId} deleted for user: ${userId}`);
  } catch (error) {
    logger.error('Error in deleteOccupation:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting occupation');
  }
};

export const occupationService = {
  createOccupation,
  getMyOccupations,
  updateOccupation,
  deleteOccupation,
};