import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { verificationService } from '../services/verification.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * [Admin] Get pending verification documents queue
 */
export const getPendingVerifications = asyncHandler(async (req, res) => {
    const result = await verificationService.getPendingVerifications(req.query);
    res
        .status(HTTP_STATUS.OK)
        .json(
            new ApiResponse(
                HTTP_STATUS.OK,
                result,
                'Pending verifications retrieved successfully'
            )
        );
});

/**
 * [Admin] Get a single document for verification review
 */
export const getVerificationById = asyncHandler(async (req, res) => {
    const document = await verificationService.getVerificationById(
        parseInt(req.params.mediaId)
    );
    res
        .status(HTTP_STATUS.OK)
        .json(
            new ApiResponse(HTTP_STATUS.OK, document, 'Document retrieved successfully')
        );
});

/**
 * [Admin] Approve a verification document
 */
export const approveVerification = asyncHandler(async (req, res) => {
    const result = await verificationService.approveVerification(
        parseInt(req.params.mediaId),
        req.user.id
    );
    res
        .status(HTTP_STATUS.OK)
        .json(
            new ApiResponse(
                HTTP_STATUS.OK,
                result,
                'Document approved successfully. Profile marked as verified.'
            )
        );
});

/**
 * [Admin] Reject a verification document
 */
export const rejectVerification = asyncHandler(async (req, res) => {
    const result = await verificationService.rejectVerification(
        parseInt(req.params.mediaId),
        req.user.id,
        req.body.reason
    );
    res
        .status(HTTP_STATUS.OK)
        .json(
            new ApiResponse(HTTP_STATUS.OK, result, 'Document rejected successfully')
        );
});

/**
 * [Admin] Request document resubmission
 */
export const requestResubmission = asyncHandler(async (req, res) => {
    const result = await verificationService.requestResubmission(
        parseInt(req.params.mediaId),
        req.user.id,
        req.body.reason
    );
    res
        .status(HTTP_STATUS.OK)
        .json(
            new ApiResponse(
                HTTP_STATUS.OK,
                result,
                'Resubmission request sent successfully'
            )
        );
});

/**
 * [Admin] Get verification statistics
 */
export const getVerificationStats = asyncHandler(async (req, res) => {
    const stats = await verificationService.getVerificationStats();
    res
        .status(HTTP_STATUS.OK)
        .json(
            new ApiResponse(HTTP_STATUS.OK, stats, 'Verification stats retrieved')
        );
});

export const verificationController = {
    getPendingVerifications,
    getVerificationById,
    approveVerification,
    rejectVerification,
    requestResubmission,
    getVerificationStats,
};
