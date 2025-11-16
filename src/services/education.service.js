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
 * Create a new education entry for a user
 * @param {number} userId - The user's ID
 * @param {Object} data - Validated education data
 * @returns {Promise<Object>} The created education entry
 */
export const createEducation = async (userId, data) => {
  const profileId = await getProfileId(userId);

  try {
    const education = await prisma.education.create({
      data: {
        profileId: profileId,
        ...data,
      },
    });
    logger.info(`Education entry created for user: ${userId}`);
    return education;
  } catch (error) {
    logger.error('Error in createEducation:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error adding education');
  }
};

/**
 * Get all education entries for a user
 * @param {number} userId - The user's ID
 * @returns {Promise<Array>} A list of education entries
 */
export const getMyEducation = async (userId) => {
  const profileId = await getProfileId(userId);

  try {
    return await prisma.education.findMany({
      where: { profileId },
      orderBy: {
        yearOfPassing: 'desc',
      },
    });
  } catch (error) {
    logger.error('Error in getMyEducation:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving education');
  }
};

/**
 * Update a specific education entry
 * @param {number} userId - The user's ID
 * @param {number} educationId - The ID of the education entry to update
 * @param {Object} data - Validated update data
 * @returns {Promise<Object>} The updated education entry
 */
export const updateEducation = async (userId, educationId, data) => {
  const profileId = await getProfileId(userId);

  try {
    const education = await prisma.education.findUnique({
      where: { id: educationId },
    });

    if (!education) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Education entry not found');
    }

    // Security Check: Ensure the user owns this education entry
    if (education.profileId !== profileId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to update this entry');
    }

    const updatedEducation = await prisma.education.update({
      where: { id: educationId },
      data: data,
    });
    
    logger.info(`Education entry ${educationId} updated for user: ${userId}`);
    return updatedEducation;
  } catch (error) {
    logger.error('Error in updateEducation:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating education');
  }
};

/**
 * Delete a specific education entry
 * @param {number} userId - The user's ID
 * @param {number} educationId - The ID of the education entry to delete
 * @returns {Promise<void>}
 */
export const deleteEducation = async (userId, educationId) => {
  const profileId = await getProfileId(userId);

  try {
    const education = await prisma.education.findUnique({
      where: { id: educationId },
    });

    if (!education) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Education entry not found');
    }

    // Security Check: Ensure the user owns this education entry
    if (education.profileId !== profileId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to delete this entry');
    }

    await prisma.education.delete({
      where: { id: educationId },
    });

    logger.info(`Education entry ${educationId} deleted for user: ${userId}`);
  } catch (error) {
    logger.error('Error in deleteEducation:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting education');
  }
};

export const educationService = {
  createEducation,
  getMyEducation,
  updateEducation,
  deleteEducation,
};