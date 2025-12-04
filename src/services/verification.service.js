import prisma from '../config/database.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, MEDIA_TYPES } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';

/**
 * [Admin] Get pending verification requests (documents awaiting review)
 * @param {Object} query - Pagination and filter params
 * @returns {Promise<Object>} Paginated list of pending verifications
 */
export const getPendingVerifications = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { type } = query; // Optional filter by document type

    try {
        const where = {
            verificationStatus: 'PENDING',
            type: {
                in: [
                    MEDIA_TYPES.ID_PROOF,
                    MEDIA_TYPES.ADDRESS_PROOF,
                    MEDIA_TYPES.INCOME_PROOF,
                    MEDIA_TYPES.EDUCATION_CERTIFICATE,
                ],
            },
            deletedAt: null,
        };

        // Filter by specific document type if provided
        if (type) {
            where.type = type;
        }

        const [documents, total] = await Promise.all([
            prisma.media.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            phone: true,
                            createdAt: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    city: true,
                                    state: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'asc' }, // FIFO queue - oldest first
            }),
            prisma.media.count({ where }),
        ]);

        const pagination = getPaginationMetadata(page, limit, total);

        return {
            documents,
            pagination,
            stats: {
                totalPending: total,
            },
        };
    } catch (error) {
        logger.error('Error in getPendingVerifications:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Error retrieving pending verifications'
        );
    }
};

/**
 * [Admin] Get a single document by ID for verification review
 * @param {number} mediaId - The media ID
 * @returns {Promise<Object>} The document details
 */
export const getVerificationById = async (mediaId) => {
    try {
        const document = await prisma.media.findUnique({
            where: { id: mediaId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        createdAt: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                dateOfBirth: true,
                                gender: true,
                                city: true,
                                state: true,
                                isVerified: true,
                            },
                        },
                    },
                },
            },
        });

        if (!document) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
        }

        return document;
    } catch (error) {
        logger.error('Error in getVerificationById:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Error retrieving document'
        );
    }
};

/**
 * [Admin] Approve a verification document
 * @param {number} mediaId - The media ID
 * @param {number} adminId - The admin performing the action
 * @returns {Promise<Object>} The updated document
 */
export const approveVerification = async (mediaId, adminId) => {
    try {
        const document = await prisma.media.findUnique({
            where: { id: mediaId },
            include: { user: { include: { profile: true } } },
        });

        if (!document) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
        }

        if (document.verificationStatus === 'APPROVED') {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Document already approved');
        }

        // Use transaction to update document AND profile verification status
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update the document status
            const updatedDocument = await tx.media.update({
                where: { id: mediaId },
                data: {
                    verificationStatus: 'APPROVED',
                    verifiedAt: new Date(),
                    verifiedBy: adminId,
                    rejectionReason: null,
                },
            });

            // 2. Update the user's profile isVerified status if this is an ID proof
            if (document.type === MEDIA_TYPES.ID_PROOF && document.user?.profile) {
                await tx.profile.update({
                    where: { id: document.user.profile.id },
                    data: {
                        isVerified: true,
                        verifiedAt: new Date(),
                    },
                });
                logger.info(`Profile ${document.user.profile.id} marked as verified`);
            }

            return updatedDocument;
        });

        // TODO: Send notification to user about approval
        logger.info(`Document ${mediaId} approved by admin ${adminId}`);
        return result;
    } catch (error) {
        logger.error('Error in approveVerification:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Error approving document'
        );
    }
};

/**
 * [Admin] Reject a verification document
 * @param {number} mediaId - The media ID
 * @param {number} adminId - The admin performing the action
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} The updated document
 */
export const rejectVerification = async (mediaId, adminId, reason) => {
    try {
        const document = await prisma.media.findUnique({
            where: { id: mediaId },
        });

        if (!document) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
        }

        if (document.verificationStatus === 'REJECTED') {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Document already rejected');
        }

        const updatedDocument = await prisma.media.update({
            where: { id: mediaId },
            data: {
                verificationStatus: 'REJECTED',
                verifiedAt: new Date(),
                verifiedBy: adminId,
                rejectionReason: reason,
            },
        });

        // TODO: Send notification to user about rejection with reason
        logger.info(`Document ${mediaId} rejected by admin ${adminId}: ${reason}`);
        return updatedDocument;
    } catch (error) {
        logger.error('Error in rejectVerification:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Error rejecting document'
        );
    }
};

/**
 * [Admin] Request resubmission of a verification document
 * @param {number} mediaId - The media ID
 * @param {number} adminId - The admin performing the action
 * @param {string} reason - Reason for resubmission request
 * @returns {Promise<Object>} The updated document
 */
export const requestResubmission = async (mediaId, adminId, reason) => {
    try {
        const document = await prisma.media.findUnique({
            where: { id: mediaId },
        });

        if (!document) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
        }

        const updatedDocument = await prisma.media.update({
            where: { id: mediaId },
            data: {
                verificationStatus: 'RESUBMIT_REQUIRED',
                verifiedAt: new Date(),
                verifiedBy: adminId,
                rejectionReason: reason,
            },
        });

        // TODO: Send notification to user requesting new document
        logger.info(
            `Document ${mediaId} resubmission requested by admin ${adminId}: ${reason}`
        );
        return updatedDocument;
    } catch (error) {
        logger.error('Error in requestResubmission:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Error requesting resubmission'
        );
    }
};

/**
 * [Admin] Get verification statistics
 * @returns {Promise<Object>} Verification stats
 */
export const getVerificationStats = async () => {
    try {
        const documentTypes = [
            MEDIA_TYPES.ID_PROOF,
            MEDIA_TYPES.ADDRESS_PROOF,
            MEDIA_TYPES.INCOME_PROOF,
            MEDIA_TYPES.EDUCATION_CERTIFICATE,
        ];

        const [pending, approved, rejected, resubmitRequired, verifiedProfiles] =
            await Promise.all([
                prisma.media.count({
                    where: {
                        verificationStatus: 'PENDING',
                        type: { in: documentTypes },
                        deletedAt: null,
                    },
                }),
                prisma.media.count({
                    where: {
                        verificationStatus: 'APPROVED',
                        type: { in: documentTypes },
                        deletedAt: null,
                    },
                }),
                prisma.media.count({
                    where: {
                        verificationStatus: 'REJECTED',
                        type: { in: documentTypes },
                        deletedAt: null,
                    },
                }),
                prisma.media.count({
                    where: {
                        verificationStatus: 'RESUBMIT_REQUIRED',
                        type: { in: documentTypes },
                        deletedAt: null,
                    },
                }),
                prisma.profile.count({
                    where: { isVerified: true },
                }),
            ]);

        return {
            documents: {
                pending,
                approved,
                rejected,
                resubmitRequired,
                total: pending + approved + rejected + resubmitRequired,
            },
            verifiedProfiles,
        };
    } catch (error) {
        logger.error('Error in getVerificationStats:', error);
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Error retrieving verification stats'
        );
    }
};

export const verificationService = {
    getPendingVerifications,
    getVerificationById,
    approveVerification,
    rejectVerification,
    requestResubmission,
    getVerificationStats,
};
