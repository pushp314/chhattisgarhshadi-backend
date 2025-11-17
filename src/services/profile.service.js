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
// ADDED: Import blockService to filter searches
import { blockService } from './block.service.js';

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
 * @param {number} userId - ID of the profile to get
 * @param {number} [currentUserId] - ID of the user making the request
 * @returns {Promise<Object>}
 */
export const getProfileByUserId = async (userId, currentUserId = null) => {
  try {
    // --- Block Check [ADDED] ---
    if (currentUserId && userId !== currentUserId) {
      const blockedIdSet = await blockService.getAllBlockedUserIds(currentUserId);
      if (blockedIdSet.has(userId)) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROFILE_NOT_FOUND);
      }
    }
    // --- End Block Check ---

    const profile = await prisma.profile.findUnique({
      where: { userId, user: { isActive: true, isBanned: false } }, // ADDED: Check user status
      include: {
        user: {
          select: {
            id: true,
            email: true, // Safe to show email on a profile page
            role: true,
            createdAt: true,
          },
        },
        // MODIFIED: Also include privacy settings for each media
        media: {
          include: {
            privacySettings: true,
          },
        },
        education: true,
        occupations: true,
      },
    });

    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    // Transform media to match frontend expectations
    const transformedMedia = profile.media?.map(m => ({
      id: m.id,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      type: m.type,
      isProfilePicture: m.isDefault,
      // ADDED: Pass privacy settings along
      privacySettings: m.privacySettings, 
    })) || [];

    // Add calculated age and transformed media
    return {
      ...profile,
      media: transformedMedia,
      isVerified: profile.isVerified,
      isActive: true,
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
 * @param {number} [currentUserId] - The ID of the user performing the search
 * @returns {Promise<Object>}
 */
export const searchProfiles = async (query, currentUserId = null) => {
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
      nativeDistrict,
      speaksChhattisgarhi
    } = query;

    const where = {
      isPublished: true, 
      user: { 
        isActive: true,
        isBanned: false,
      }
    };

    if (currentUserId) {
      const blockedIds = Array.from(await blockService.getAllBlockedUserIds(currentUserId));
      blockedIds.push(currentUserId);
      where.userId = { notIn: blockedIds };
    }
    
    if (gender) where.gender = gender;
    if (maritalStatus) where.maritalStatus = maritalStatus;
    if (nativeDistrict) where.nativeDistrict = { equals: nativeDistrict, mode: 'insensitive' };
    if (speaksChhattisgarhi !== undefined) where.speaksChhattisgarhi = speaksChhattisgarhi;
    if (religions && religions.length > 0) where.religion = { in: religions };
    if (castes && castes.length > 0) where.caste = { in: castes, mode: 'insensitive' };
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
          media: { 
            where: { type: 'PROFILE_PHOTO', isDefault: true }, // MODIFIED: Only get default profile photo
            include: { privacySettings: true } // Also get its settings
          },
        },
        orderBy: {
          user: {
            role: 'desc',
          },
        },
      }),
      prisma.profile.count({ where }),
    ]);

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
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error searching profiles');
  }
};

/**
 * Add photo URL to Media table
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

    // --- MODIFICATION [ADDED] ---
    // Create Media and its PhotoPrivacySettings in a transaction
    const newMedia = await prisma.$transaction(async (tx) => {
      // 1. Create the Media object
      const media = await tx.media.create({
        data: {
          userId: userId,
          profileId: profile.id,
          type: mediaType,
          url: mediaData.url,
          thumbnailUrl: mediaData.thumbnailUrl,
          fileName: mediaData.fileName, // Corrected from filename
          fileSize: mediaData.fileSize,
          mimeType: mediaData.mimeType,
          // TODO: Add logic for isDefault
        },
      });

      // 2. Create the default PhotoPrivacySettings for this media
      await tx.photoPrivacySettings.create({
        data: {
          mediaId: media.id,
          userId: userId,
          // All other fields will use the @default values from schema.prisma
        },
      });

      return media;
    });
    // --- End Modification ---

    // Recalculate profile completeness
    await updateProfileCompleteness(prisma, userId);

    logger.info(`Photo and privacy settings added for user: ${userId}`);
    // Return the media object (the privacy settings are linked)
    return newMedia;
  } catch (error) {
    logger.error('Error in addPhoto:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error adding photo');
  }
};

/**
 * Remove photo from Media table and S3
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

    if (media.userId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to delete this photo');
    }

    // 1. Delete from S3
    const key = uploadService.extractKeyFromUrl(media.url);
    if (key) {
      await uploadService.deleteFile(key);
    }
    if (media.thumbnailUrl) {
      const thumbKey = uploadService.extractKeyFromUrl(media.thumbnailUrl);
      if (thumbKey) {
        await uploadService.deleteFile(thumbKey);
      }
    }

    // 2. Delete from database
    // The `onDelete: Cascade` in Prisma schema for PhotoPrivacySettings
    // ensures that the privacy settings are automatically deleted when the media is deleted.
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
  addPhoto,
  deletePhoto,
};