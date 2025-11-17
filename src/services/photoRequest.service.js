import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, PHOTO_REQUEST_STATUS, USER_ROLES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
import { blockService } from './block.service.js';
// Import notificationService to send notifications
import { notificationService } from './notification.service.js'; 

// Reusable select for public user data
const userPublicSelect = {
  id: true,
  profilePicture: true,
  role: true,
  preferredLanguage: true,
  profile: true,
};

/**
 * Create a new photo view request
 * @param {number} requesterId - The user making the request
 * @param {Object} data - Validated request data
 * @returns {Promise<Object>} The created photo view request
 */
export const createPhotoRequest = async (requesterId, data) => {
  const { photoId, message } = data;

  try {
    // 1. Get the photo, its owner, and its privacy settings
    const media = await prisma.media.findUnique({
      where: { id: photoId },
      include: { privacySettings: true },
    });

    if (!media) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Photo not found');
    }

    const ownerId = media.userId; // The user who owns the photo

    if (requesterId === ownerId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You cannot request to view your own photo');
    }

    // 2. Check for Blocks
    const blockedIdSet = await blockService.getAllBlockedUserIds(requesterId);
    if (blockedIdSet.has(ownerId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot interact with this user');
    }

    // 3. Check Requester's subscription (assuming this is a premium feature)
    // Note: This check is often best handled by the `requireSubscription` middleware on the route
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (requester.role !== USER_ROLES.PREMIUM_USER && requester.role !== USER_ROLES.ADMIN) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You must be a premium member to request photo access');
    }

    // 4. Check Photo's privacy settings
    if (!media.privacySettings || !media.privacySettings.allowViewRequests) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'This user does not accept view requests for this photo');
    }

    // 5. Check for existing pending request (using the schema's unique constraint)
    const existingRequest = await prisma.photoViewRequest.findFirst({
        where: {
            requesterId,
            photoId,
            status: PHOTO_REQUEST_STATUS.PENDING
        }
    });

    if(existingRequest) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'You already have a pending request for this photo');
    }

    // 6. Create the request
    const request = await prisma.photoViewRequest.create({
      data: {
        requesterId,
        profileId: ownerId, // profileId in the schema is the owner's ID
        photoId,
        message: message || null,
        status: PHOTO_REQUEST_STATUS.PENDING,
      },
    });

    // 7. Send notification to the photo owner
    await notificationService.createNotification({
        userId: ownerId,
        type: 'PHOTO_VIEW_REQUEST', // TODO: Add this to constants.js
        title: 'New Photo View Request',
        message: `${requester.profile?.firstName || 'Someone'} has requested to view your photo.`,
        data: { requesterId, photoId, requestId: request.id },
    });
    
    logger.info(`Photo view request sent from ${requesterId} to ${ownerId} for photo ${photoId}`);
    return request;

  } catch (error) {
    logger.error('Error in createPhotoRequest:', error);
    if (error instanceof ApiError) throw error;
    if (error.code === 'P2002') { // Handle unique constraint
      throw new ApiError(HTTP_STATUS.CONFLICT, 'You already have a pending request for this photo');
    }
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error creating photo request');
  }
};

/**
 * Get all photo view requests sent by the user
 * @param {number} userId - The user's ID
 * @param {Object} query - Pagination and filter query
 * @returns {Promise<Object>} Paginated list of sent requests
 */
export const getSentRequests = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const where = { 
    requesterId: userId,
    ...(query.status && { status: query.status }),
  };

  try {
    const [requests, total] = await Promise.all([
      prisma.photoViewRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          profile: { select: userPublicSelect }, // 'profile' is relation to Owner
          photo: true, // Include media info
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.photoViewRequest.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);
    return { requests, pagination };

  } catch (error) {
    logger.error('Error in getSentRequests:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving sent requests');
  }
};

/**
 * Get all photo view requests received by the user
 * @param {number} userId - The user's ID
 * @param {Object} query - Pagination and filter query
 * @returns {Promise<Object>} Paginated list of received requests
 */
export const getReceivedRequests = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  
  const blockedIdSet = await blockService.getAllBlockedUserIds(userId);

  const where = {
    profileId: userId, // The user is the owner of the photo
    requesterId: { notIn: Array.from(blockedIdSet) },
    ...(query.status && { status: query.status }),
  };

  try {
    const [requests, total] = await Promise.all([
      prisma.photoViewRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          requester: { select: userPublicSelect }, // 'requester' is relation to User
          photo: true, // Include media info
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.photoViewRequest.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);
    return { requests, pagination };

  } catch (error) {
    logger.error('Error in getReceivedRequests:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving received requests');
  }
};

/**
 * Respond to a photo view request (Approve/Reject)
 * @param {number} userId - The user responding (must be the owner)
 * @param {number} requestId - The ID of the photo view request
 * @param {string} status - 'APPROVED' or 'REJECTED'
 * @returns {Promise<Object>} The updated photo view request
 */
export const respondToRequest = async (userId, requestId, status) => {
  try {
    const request = await prisma.photoViewRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Photo view request not found');
    }

    // Security check: Only the photo owner (profileId) can respond
    if (request.profileId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to respond to this request');
    }

    if (request.status !== PHOTO_REQUEST_STATUS.PENDING) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This request has already been responded to');
    }

    // Set expiry date if approved
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedRequest = await prisma.photoViewRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === PHOTO_REQUEST_STATUS.APPROVED && { 
            approvedAt: new Date(),
            validUntil: sevenDaysFromNow // Set 7-day validity
        }),
      },
    });

    // Send notification to `requesterId` about the response
    const owner = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { profile: { select: { firstName: true }}}
    });
    const ownerName = owner?.profile?.firstName || 'The owner';

    await notificationService.createNotification({
        userId: request.requesterId,
        type: status === 'APPROVED' ? 'PHOTO_REQUEST_APPROVED' : 'PHOTO_REQUEST_REJECTED', // TODO: Add to constants
        title: `Photo request ${status.toLowerCase()}`,
        message: `${ownerName} ${status.toLowerCase()} your request to view their photo.`,
        data: { profileId: userId, photoId: request.photoId, requestId: request.id },
    });
    
    logger.info(`Photo request ${requestId} was ${status} by user ${userId}`);
    return updatedRequest;

  } catch (error) {
    logger.error('Error in respondToRequest:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error responding to request');
  }
};

export const photoRequestService = {
  createPhotoRequest,
  getSentRequests,
  getReceivedRequests,
  respondToRequest,
};