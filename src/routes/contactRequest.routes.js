import { Router } from 'express';
import { contactRequestController } from '../controllers/contactRequest.controller.js';
import { authenticate, requireCompleteProfile, requireSubscription } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createContactRequestSchema,
  respondContactRequestSchema,
  getContactRequestsSchema,
  // contactRequestIdParamSchema, // <-- FIX: Removed unused import
} from '../validation/contactRequest.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/contact-request:
 * post:
 * summary: Send a contact info request (Premium Only)
 * tags: [Contact Request]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CreateContactRequest'
 * responses:
 * 201:
 * description: Request sent successfully
 */
// This specific route requires a subscription
router
  .route('/')
  .post(
    requireSubscription, // <-- Added subscription check
    validate(createContactRequestSchema), 
    contactRequestController.createContactRequest
  );

/**
 * @swagger
 * /api/v1/contact-request/sent:
 * get:
 * summary: Get all contact requests you have sent
 * tags: [Contact Request]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: page
 * - in: query
 * name: limit
 * - in: query
 * name: status
 * schema:
 * type: string
 * enum: [PENDING, APPROVED, REJECTED]
 * responses:
 * 200:
 * description: Paginated list of your sent requests
 */
router
  .route('/sent')
  .get(validate(getContactRequestsSchema), contactRequestController.getSentRequests);

/**
 * @swagger
 * /api/v1/contact-request/received:
 * get:
 * summary: Get all contact requests you have received
 * tags: [Contact Request]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: page
 * - in: query
 * name: limit
 * - in: query
 * name: status
 * schema:
 * type: string
 * enum: [PENDING, APPROVED, REJECTED]
 * responses:
 * 200:
 * description: Paginated list of your received requests
 */
router
  .route('/received')
  .get(validate(getContactRequestsSchema), contactRequestController.getReceivedRequests);

/**
 * @swagger
 * /api/v1/contact-request/{id}/respond:
 * post:
 * summary: Respond to a contact request (Approve/Reject)
 * tags: [Contact Request]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * enum: [APPROVED, REJECTED]
 * responses:
 * 200:
 * description: Response submitted successfully
 */
router
  .route('/:id/respond')
  .post(validate(respondContactRequestSchema), contactRequestController.respondToRequest);

export default router;