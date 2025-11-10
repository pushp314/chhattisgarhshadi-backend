import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata, calculateAge } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * Create user profile
 * @param {string} userId - User ID
 * @param {Object} data - Profile data
 * @returns {Promise<Object>}
 */
export const createProfile = async (userId, data) => {
  try {
    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Profile already exists');
    }

    const profile = await prisma.profile.create({
      data: {
        userId,
        ...data,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Profile created for user: ${userId}`);
    return profile;
  } catch (error) {
    logger.error('Error in createProfile:', error);
    throw error;
  }
};

/**
 * Get profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export const getProfileByUserId = async (userId) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    // Add calculated age
    return {
      ...profile,
      age: calculateAge(profile.dateOfBirth),
    };
  } catch (error) {
    logger.error('Error in getProfileByUserId:', error);
    throw error;
  }
};

/**
 * Update profile
 * @param {string} userId - User ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>}
 */
export const updateProfile = async (userId, data) => {
  try {
    const profile = await prisma.profile.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Profile updated for user: ${userId}`);
    return {
      ...profile,
      age: calculateAge(profile.dateOfBirth),
    };
  } catch (error) {
    logger.error('Error in updateProfile:', error);
    throw error;
  }
};

/**
 * Delete profile
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteProfile = async (userId) => {
  try {
    await prisma.profile.delete({
      where: { userId },
    });

    logger.info(`Profile deleted for user: ${userId}`);
  } catch (error) {
    logger.error('Error in deleteProfile:', error);
    throw error;
  }
};

/**
 * Search profiles with filters
 * @param {Object} filters - Search filters
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>}
 */
export const searchProfiles = async (filters, query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {};

    if (filters.gender) {
      where.gender = filters.gender;
    }

    if (filters.maritalStatus) {
      where.maritalStatus = filters.maritalStatus;
    }

    if (filters.religion) {
      where.religion = { contains: filters.religion, mode: 'insensitive' };
    }

    if (filters.caste) {
      where.caste = { contains: filters.caste, mode: 'insensitive' };
    }

    if (filters.minHeight && filters.maxHeight) {
      where.height = {
        gte: filters.minHeight,
        lte: filters.maxHeight,
      };
    }

    if (filters.minAge || filters.maxAge) {
      const today = new Date();
      
      if (filters.minAge) {
        const maxDOB = new Date(today.getFullYear() - filters.minAge, today.getMonth(), today.getDate());
        where.dateOfBirth = { ...where.dateOfBirth, lte: maxDOB };
      }
      
      if (filters.maxAge) {
        const minDOB = new Date(today.getFullYear() - filters.maxAge - 1, today.getMonth(), today.getDate());
        where.dateOfBirth = { ...where.dateOfBirth, gte: minDOB };
      }
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.profile.count({ where }),
    ]);

    // Add calculated age to each profile
    const profilesWithAge = profiles.map(profile => ({
      ...profile,
      age: calculateAge(profile.dateOfBirth),
    }));

    const pagination = getPaginationMetadata(page, limit, total);

    return {
      profiles: profilesWithAge,
      pagination,
    };
  } catch (error) {
    logger.error('Error in searchProfiles:', error);
    throw error;
  }
};

/**
 * Add photo to profile
 * @param {string} userId - User ID
 * @param {string} photoUrl - Photo URL
 * @returns {Promise<Object>}
 */
export const addPhoto = async (userId, photoUrl) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const photos = Array.isArray(profile.photos) ? profile.photos : [];
    photos.push(photoUrl);

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: { photos },
    });

    logger.info(`Photo added to profile: ${userId}`);
    return updatedProfile;
  } catch (error) {
    logger.error('Error in addPhoto:', error);
    throw error;
  }
};

/**
 * Remove photo from profile
 * @param {string} userId - User ID
 * @param {string} photoUrl - Photo URL to remove
 * @returns {Promise<Object>}
 */
export const removePhoto = async (userId, photoUrl) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const photos = Array.isArray(profile.photos)
      ? profile.photos.filter(url => url !== photoUrl)
      : [];

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: { photos },
    });

    logger.info(`Photo removed from profile: ${userId}`);
    return updatedProfile;
  } catch (error) {
    logger.error('Error in removePhoto:', error);
    throw error;
  }
};

export const profileService = {
  createProfile,
  getProfileByUserId,
  updateProfile,
  deleteProfile,
  searchProfiles,
  addPhoto,
  removePhoto,
};
