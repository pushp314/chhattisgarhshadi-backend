import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, CONTACT_REQUEST_STATUS, USER_ROLES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
import { blockService } from './block.service.js';
// We need to check the user's own settings and the receiver's settings
// FIX: Removed unused import 'privacyService'
// import { privacyService } from './privacy.service.js'; 

// Reusable select for public user data
const userPublicSelect = {
  id: true,
  profilePicture: true,
  role: true,
  preferredLanguage: true,
  profile: true,
};

/**
 * Create a new contact request
 * @param {number} requesterId - The user making the request
 * @param {Object} data - Validated request data
 * @returns {Promise<Object>} The created contact request
 */
export const createContactRequest = async (requesterId, data) => {
  const { profileId, requestType, message } = data;

  if (requesterId === profileId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You cannot request your own contact info');
  }

  try {
    // 1. Check for Blocks
    const blockedIdSet = await blockService.getAllBlockedUserIds(requesterId);
    if (blockedIdSet.has(profileId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot interact with this user');
    }

    // 2. Get Requester (to check subscription) and Receiver (to check privacy)
    const [requester, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: requesterId } }),
      prisma.user.findUnique({ 
        where: { id: profileId, isActive: true },
        include: { profilePrivacySettings: true }
      })
    ]);

    if (!receiver) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'The user you are requesting from does not exist');
    }

    // 3. Check if Requester is a Premium User (assuming this is a premium feature)
    if (requester.role !== USER_ROLES.PREMIUM_USER && requester.role !== USER_ROLES.ADMIN) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You must be a premium member to request contact information');
    }

    // 4. Check Receiver's privacy settings
    const privacy = receiver.profilePrivacySettings;
    if (privacy) {
      if (requestType === 'PHONE' && privacy.showPhoneNumber === 'HIDDEN') {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'This user does not accept phone requests');
      }
      if (requestType === 'EMAIL' && privacy.showEmail === 'HIDDEN') {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'This user does not accept email requests');
      }
      // Add more checks as needed (e.g., social media)
    }

    // 5. Check for existing pending request
    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        requesterId,
        profileId,
        requestType,
        status: CONTACT_REQUEST_STATUS.PENDING,
      },
    });

    if (existingRequest) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'You already have a pending request of this type for this user');
    }
    
    // 6. Create the request
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day expiry
    const request = await prisma.contactRequest.create({
      data: {
        requesterId,
        profileId,
        requestType,
        message: message || null,
        status: CONTACT_REQUEST_STATUS.PENDING,
        expiresAt,
      },
    });

    // 7. TODO: Send a notification to the `profileId` user
    
    logger.info(`Contact request sent from ${requesterId} to ${profileId} for ${requestType}`);
    return request;

  } catch (error) {
    logger.error('Error in createContactRequest:', error);
    if (error instanceof ApiError) throw error;
    if (error.code === 'P2002') {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'A similar request already exists');
    }
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error creating contact request');
  }
};

/**
 * Get all contact requests sent by the user
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
      prisma.contactRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          profile: { select: userPublicSelect }, // 'profile' is relation to User
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contactRequest.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);
    return { requests, pagination };

  } catch (error) {
    logger.error('Error in getSentRequests:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving sent requests');
  }
};

/**
 * Get all contact requests received by the user
 * @param {number} userId - The user's ID
 * @param {Object} query - Pagination and filter query
 * @returns {Promise<Object>} Paginated list of received requests
 */
export const getReceivedRequests = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  
  // Also filter out requests from users the receiver has blocked
  const blockedIdSet = await blockService.getAllBlockedUserIds(userId);

  const where = {
    profileId: userId,
    requesterId: { notIn: Array.from(blockedIdSet) },
    ...(query.status && { status: query.status }),
  };

  try {
    const [requests, total] = await Promise.all([
      prisma.contactRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          requester: { select: userPublicSelect }, // 'requester' is relation to User
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contactRequest.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);
    return { requests, pagination };

  } catch (error) { 
    logger.error('Error in getReceivedRequests:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving received requests');
  }
};

/**
 * Respond to a contact request (Approve/Reject)
 * @param {number} userId - The user responding (must be the receiver)
 * @param {number} requestId - The ID of the contact request
 * @param {string} status - 'APPROVED' or 'REJECTED'
 * @returns {Promise<Object>} The updated contact request
 */
export const respondToRequest = async (userId, requestId, status) => {
  try {
    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Contact request not found');
    }

    // Security check: Only the receiver can respond
    if (request.profileId !== userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not authorized to respond to this request');
    }

    if (request.status !== CONTACT_REQUEST_STATUS.PENDING) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This request has already been responded to');
    }

    const updatedRequest = await prisma.contactRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === CONTACT_REQUEST_STATUS.APPROVED && { approvedAt: new Date() }),
        ...(status === CONTACT_REQUEST_STATUS.REJECTED && { rejectedAt: new Date() }),
      },
    });

    // TODO: Send notification to `requesterId` about the response
    
    logger.info(`Contact request ${requestId} was ${status} by user ${userId}`);
    return updatedRequest;

  } catch (error) {
    logger.error('Error in respondToRequest:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error responding to request');
  }
};

export const contactRequestService = {
  createContactRequest,
  getSentRequests,
  getReceivedRequests,
  respondToRequest,
};