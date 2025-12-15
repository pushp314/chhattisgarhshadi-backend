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

    // Filter out fields not in the schema
    // eslint-disable-next-line no-unused-vars
    const { bloodGroup, complexion, bodyType, ...validData } = data;

    const profile = await prisma.profile.create({
      data: {
        userId,
        ...validData,
        isDraft: false,        // Mark as complete
        isPublished: true,     // Auto-publish so it appears in searches
        publishedAt: new Date(), // Set publish timestamp
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

    // --- Match Status Check [ADDED] ---
    let matchStatus = null;
    if (currentUserId && userId !== currentUserId) {
      const matchRequest = await prisma.matchRequest.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId },
          ],
        },
        select: { status: true, senderId: true },
      });

      // If found, set status. Also useful to know WHO sent it, but status is key.
      matchStatus = matchRequest?.status || null;

      // Special case: If I am the receiver and it's PENDING, viewed logic might vary?
      // For now, just returning the status key ('PENDING', 'ACCEPTED', etc.) is enough.
    }
    // --- End Match Status Check ---

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
      matchStatus, // Added to response
    };
  } catch (error) {
    logger.error('Error in getProfileByUserId:', error);
    logger.error('Error stack:', error.stack); // Add stack trace
    logger.error('Error details:', { userId, currentUserId, message: error.message }); // Add context
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `Error retrieving profile: ${error.message}`);
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
    // Filter out fields not in the schema
    // eslint-disable-next-line no-unused-vars
    const { bloodGroup, complexion, bodyType, ...validData } = data;

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: validData,
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
 * Search/filter profiles with optional type-based algorithms
 * @param {Object} query - Search parameters
 * @param {number} currentUserId - ID of requesting user
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
      speaksChhattisgarhi,
      // NEW FILTERS
      education,
      income,
      annualIncome,
      withPhoto,
      isVerified,
      // SECTION TYPE - featured, new, recommended
      type,
    } = query;

    const where = {
      isPublished: true,
      user: {
        isActive: true,
        isBanned: false,
      }
    };

    // ADDED: Auto-filter by opposite gender if user is logged in
    if (currentUserId) {
      const blockedIds = Array.from(await blockService.getAllBlockedUserIds(currentUserId));
      blockedIds.push(currentUserId);
      where.userId = { notIn: blockedIds };

      // Get current user's gender and filter opposite
      if (!gender) { // Only auto-filter if gender not explicitly provided
        const currentUserProfile = await prisma.profile.findUnique({
          where: { userId: currentUserId },
          select: { gender: true },
        });

        if (currentUserProfile?.gender) {
          // Filter opposite gender: Male sees Female, Female sees Male
          where.gender = currentUserProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';
        }
      }
    }

    if (gender) where.gender = gender;

    // Marital Status - Support comma-separated string or array
    if (maritalStatus) {
      const statuses = typeof maritalStatus === 'string'
        ? maritalStatus.split(',').map(s => s.trim().toUpperCase().replace(/ /g, '_'))
        : maritalStatus;
      if (statuses.length === 1) {
        where.maritalStatus = statuses[0];
      } else if (statuses.length > 1) {
        where.maritalStatus = { in: statuses };
      }
    }

    if (nativeDistrict) where.nativeDistrict = { equals: nativeDistrict, mode: 'insensitive' };
    if (speaksChhattisgarhi !== undefined) where.speaksChhattisgarhi = speaksChhattisgarhi === 'true' || speaksChhattisgarhi === true;

    // Religion - Support comma-separated string or array
    if (religions) {
      const religionList = typeof religions === 'string' ? religions.split(',').map(r => r.trim().toUpperCase()) : religions;
      if (religionList.length > 0) {
        where.religion = { in: religionList };
      }
    }

    // Caste - Support comma-separated string or array
    if (castes) {
      const casteList = typeof castes === 'string' ? castes.split(',').map(c => c.trim()) : castes;
      if (casteList.length > 0) {
        where.caste = { in: casteList, mode: 'insensitive' };
      }
    }

    // Height filters (in cm)
    if (minHeight) where.height = { ...where.height, gte: parseFloat(minHeight) };
    if (maxHeight) where.height = { ...where.height, lte: parseFloat(maxHeight) };

    // Age filter via DOB calculation
    if (minAge || maxAge) {
      const today = new Date();
      where.dateOfBirth = {};
      if (minAge) {
        const maxDOB = new Date(today.getFullYear() - parseInt(minAge), today.getMonth(), today.getDate());
        where.dateOfBirth.lte = maxDOB;
      }
      if (maxAge) {
        const minDOB = new Date(today.getFullYear() - parseInt(maxAge) - 1, today.getMonth(), today.getDate());
        where.dateOfBirth.gte = minDOB;
      }
    }

    // NEW: Education filter
    if (education && education !== 'Any') {
      where.education = { contains: education, mode: 'insensitive' };
    }

    // NEW: Income/AnnualIncome filter
    const incomeValue = income || annualIncome;
    if (incomeValue && incomeValue !== 'Any') {
      // Parse income ranges like "3-6 LPA", "10-15 LPA", "25+ LPA"
      if (incomeValue.includes('+')) {
        // "25+ LPA" means >= 25
        where.annualIncome = { contains: incomeValue.replace('+', ''), mode: 'insensitive' };
      } else {
        where.annualIncome = { contains: incomeValue, mode: 'insensitive' };
      }
    }

    // NEW: Is Verified filter
    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true' || isVerified === true;
    }

    // === TYPE-BASED ALGORITHMS ===
    let orderBy = [{ user: { role: 'desc' } }]; // Default: Premium first

    if (type === 'featured') {
      // FEATURED: Premium users with high profile completeness and photos
      // Algorithm: Premium first, then by completeness, must have photos
      where.profileCompleteness = { gte: 60 };
      where.media = { some: { type: { in: ['PROFILE_PHOTO', 'GALLERY_PHOTO'] } } };
      orderBy = [
        { user: { role: 'desc' } },           // Premium first
        { profileCompleteness: 'desc' },       // Then by completeness
        { viewCount: 'desc' },                 // Then by popularity
      ];
    } else if (type === 'new' || type === 'justJoined') {
      // NEW/JUST JOINED: Profiles created in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo };
      orderBy = [
        { createdAt: 'desc' },                 // Newest first
        { profileCompleteness: 'desc' },       // Then by completeness
      ];
    } else if (type === 'recommended') {
      // RECOMMENDED: Matching partner preferences (if available)
      // For now: profiles with high completeness ordered by interaction potential
      orderBy = [
        { profileCompleteness: 'desc' },       // Most complete profiles
        { viewCount: 'desc' },                 // Popular profiles
        { user: { role: 'desc' } },            // Premium users
      ];
    }

    // Base query options
    const queryOptions = {
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, role: true } },
        media: {
          where: { type: 'PROFILE_PHOTO' },
          include: { privacySettings: true }
        },
      },
      orderBy,
    };

    // NEW: With Photo filter - only include profiles with at least one photo
    if (withPhoto === 'true' || withPhoto === true) {
      queryOptions.where.media = {
        some: {
          type: { in: ['PROFILE_PHOTO', 'GALLERY_PHOTO'] }
        }
      };
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany(queryOptions),
      prisma.profile.count({ where }),
    ]);

    // Add match status for each profile
    const profilesWithAge = await Promise.all(profiles.map(async (profile) => {
      let matchStatus = null;

      if (currentUserId) {
        // Check if there's a match request between current user and this profile
        const matchRequest = await prisma.matchRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: profile.userId },
              { senderId: profile.userId, receiverId: currentUserId },
            ],
          },
          select: { status: true },
        });

        matchStatus = matchRequest?.status || null;
      }

      return {
        ...profile,
        age: calculateAge(profile.dateOfBirth),
        matchStatus, // 'PENDING', 'ACCEPTED', 'REJECTED', or null
      };
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