import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import {
  getPaginationParams,
  getPaginationMetadata,
  calculateAge,
} from '../utils/helpers.js';
import { updateProfileCompleteness } from '../utils/profile.helpers.js';
import { logger } from '../config/logger.js';
// Import uploadService to delete S3 objects
import { uploadService } from './upload.service.js';

/**
 * Create user profile
 * @param {string} userId - User ID
 * @param {Object} data - Profile data (validated)
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
    });

    // Calculate and update completeness score
    const score = await updateProfileCompleteness(prisma, userId);
    profile.profileCompleteness = score;

    logger.info(`Profile created for user: ${userId}`);
    return profile;
  } catch (error) {
    logger.error('Error in createProfile:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error creating profile');
  }
};

/**
 * Get profile by user ID
 * @param {number} userId - User ID
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
            email: true, // Safe to show email on a profile page
            role: true,
            createdAt: true,
          },
        },
        media: true, // Include all media (photos, documents)
        education: true,
        occupations: true,
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
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving profile');
  }
};

/**
 * Update profile
 * @param {string} userId - User ID
 * @param {Object} data - Update data (validated and safe)
 * @returns {Promise<Object>}
 */
export const updateProfile = async (userId, data) => {
  try {
    // Data is pre-validated by Zod and .strict() in the validation schema,
    // so we can safely pass it. 'isVerified', 'profileCompleteness', etc., are rejected.
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data,
    });

    // Recalculate and update completeness score
    const score = await updateProfileCompleteness(prisma, userId);
    updatedProfile.profileCompleteness = score;

    logger.info(`Profile updated for user: ${userId}`);
    
    return {
      ...updatedProfile,
      age: calculateAge(updatedProfile.dateOfBirth),
    };
  } catch (error) {
    logger.error('Error in updateProfile:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating profile');
  }
};

/**
 * Delete profile
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteProfile = async (userId) => {
  try {
    // Note: This only deletes the profile.
    // The user's account (User model) will still exist.
    // The 'deleteMe' in user.service.js is the correct "delete account" flow.
    await prisma.profile.delete({
      where: { userId },
    });

    logger.info(`Profile deleted for user: ${userId}`);
  } catch (error) {
    logger.error('Error in deleteProfile:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting profile');
  }
};

/**
 * Search profiles with filters
 * @param {Object} query - Query parameters (validated)
 * @returns {Promise<Object>}
 */
export const searchProfiles = async (query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);
    const {
      gender,
      minAge,
      maxAge,
      religions,
      castes,
      maritalStatus,
      minHeight,
      maxHeight,
    } = query;

    const where = {
      isPublished: true, // Only search published profiles
    };

    if (gender) where.gender = gender;
    if (maritalStatus) where.maritalStatus = maritalStatus;

    // PERFORMANCE FIX: Use 'in' for enums, not 'contains'
    if (religions && religions.length > 0) {
      where.religion = { in: religions };
    }
    
    // PERFORMANCE NOTE: 'in' is better, but 'contains' is kept for flexibility
    // For true performance, use Full-Text Search on an indexed column.
    if (castes && castes.length > 0) {
      where.caste = { in: castes, mode: 'insensitive' };
    }

    if (minHeight) where.height = { ...where.height, gte: minHeight };
    if (maxHeight) where.height = { ...where.height, lte: maxHeight };

    if (minAge || maxAge) {
      const today = new Date();
      where.dateOfBirth = {};
      if (minAge) {
        const maxDOB = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        where.dateOfBirth.lte = maxDOB;
      }
      if (maxAge) {
        const minDOB = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
        where.dateOfBirth.gte = minDOB;
      }
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, role: true } },
          media: { where: { type: 'PROFILE_PHOTO' } }, // Only get profile photos for search
        },
        orderBy: {
          user: {
            role: 'desc', // Show PREMIUM_USER first (if you change role logic)
          },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    // Add calculated age to each profile
    const profilesWithAge = profiles.map((profile) => ({
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
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error searching profiles');
  }
};

/**
 * [FIXED] Add photo URL to Media table
 * This is called by upload.controller.js
 * @param {string} userId - User ID
 * @param {Object} mediaData - { url, thumbnailUrl, key, ... } from uploadService
 * @param {string} mediaType - e.g., 'PROFILE_PHOTO'
 * @returns {Promise<Object>}
 */
export const addPhoto = async (userId, mediaData, mediaType) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const newMedia = await prisma.media.create({
      data: {
        userId: userId,
        profileId: profile.id,
        type: mediaType,
        url: mediaData.url,
        thumbnailUrl: mediaData.thumbnailUrl,
        fileName: mediaData.filename,
        fileSize: mediaData.size,
        mimeType: mediaData.mimetype,
        // You might want to add logic for isDefault
      },
    });

    // Recalculate profile completeness
    await updateProfileCompleteness(prisma, userId);

    logger.info(`Photo added to Media table for user: ${userId}`);
    return newMedia;
  } catch (error) {
    logger.error('Error in addPhoto:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error adding photo');
  }
};

/**
 * [FIXED] Remove photo from Media table and S3
 * @param {string} userId - User ID (for verification)
 * @param {number} mediaId - The ID of the media to delete
 * @returns {Promise<void>}
 */
export const deletePhoto = async (userId, mediaId) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Photo not found');
    }

    // Security check: Ensure the user owns this photo
    if (media.userId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to delete this photo');
    }

    // 1. Delete from S3
    // We need the key. Assuming URL is the full S3 URL
    const key = uploadService.extractKeyFromUrl(media.url);
    if (key) {
      await uploadService.deleteFromS3(key);
    }
    // Also delete thumbnail if it exists
    if (media.thumbnailUrl) {
      const thumbKey = uploadService.extractKeyFromUrl(media.thumbnailUrl);
      if (thumbKey) {
        await uploadService.deleteFromS3(thumbKey);
      }
    }

    // 2. Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });

    // 3. Recalculate profile completeness
    await updateProfileCompleteness(prisma, userId);

    logger.info(`Photo deleted: ${mediaId} by user: ${userId}`);
  } catch (error) {
    logger.error('Error in deletePhoto:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting photo');
  }
};

export const profileService = {
  createProfile,
  getProfileByUserId,
  updateProfile,
  deleteProfile,
  searchProfiles,
  addPhoto, // This is the fixed version
  deletePhoto, // This is the new, fixed version
};