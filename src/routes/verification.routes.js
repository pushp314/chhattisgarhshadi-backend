import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
    getVerificationsQuerySchema,
    mediaIdParamSchema,
    rejectVerificationSchema,
} from '../validation/verification.validation.js';

const router = Router();

// Note: Authentication (authenticate + requireAdmin)
// is already applied in src/routes/admin.routes.js

// Get pending document queue
router.get(
    '/pending',
    validate(getVerificationsQuerySchema),
    verificationController.getPendingVerifications
);

// Get verification statistics
router.get('/stats', verificationController.getVerificationStats);

// Get a single document for review
router.get(
    '/:mediaId',
    validate(mediaIdParamSchema),
    verificationController.getVerificationById
);

// Approve a document
router.post(
    '/:mediaId/approve',
    validate(mediaIdParamSchema),
    verificationController.approveVerification
);

// Reject a document
router.post(
    '/:mediaId/reject',
    validate(rejectVerificationSchema),
    verificationController.rejectVerification
);

// Request resubmission
router.post(
    '/:mediaId/resubmit',
    validate(rejectVerificationSchema), // Same schema - requires reason
    verificationController.requestResubmission
);

export default router;
