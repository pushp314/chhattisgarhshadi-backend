import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { createReportSchema } from '../validation/report.validation.js';

const router = Router();

// All report routes require authentication
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/report:
 * post:
 * summary: Report a user
 * tags: [Report]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * reportedUserId:
 * type: integer
 * reason:
 * type: string
 * enum: [FAKE_PROFILE, INAPPROPRIATE_CONTENT, HARASSMENT, SCAM, SPAM, UNDERAGE, IMPERSONATION, PRIVACY_VIOLATION, OTHER]
 * description:
 * type: string
 * evidence:
 * type: string
 * description: Optional JSON string of evidence URLs
 * responses:
 * 201:
 * description: Report submitted successfully
 */
router
  .route('/')
  .post(validate(createReportSchema), reportController.createReport);

export default router;