import { Router } from 'express';
import { photoRequestController } from '../controllers/photoRequest.controller.js';
import { authenticate, requireCompleteProfile, requireSubscription } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createPhotoRequestSchema,
  respondPhotoRequestSchema,
  getPhotoRequestsSchema,
} from '../validation/photoRequest.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/photo-request:
 * post:
 * summary: Send a photo view request (Premium Only)
 * tags: [Photo Request]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CreatePhotoRequest'
 * responses:
 * 201:
 * description: Request sent successfully
 */
// This specific route requires a subscription
router
  .route('/')
  .post(
    requireSubscription, // <-- Added subscription check
    validate(createPhotoRequestSchema), 
    photoRequestController.createPhotoRequest
  );

/**
 * @swagger
 * /api/v1/photo-request/sent:
 * get:
 * summary: Get all photo view requests you have sent
 * tags: [Photo Request]
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
  .get(validate(getPhotoRequestsSchema), photoRequestController.getSentRequests);

/**
 * @swagger
 * /api/v1/photo-request/received:
 * get:
 * summary: Get all photo view requests you have received
 * tags: [Photo Request]
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
  .get(validate(getPhotoRequestsSchema), photoRequestController.getReceivedRequests);

/**
 * @swagger
 * /api/v1/photo-request/{id}/respond:
 * post:
 * summary: Respond to a photo view request (Approve/Reject)
 * tags: [Photo Request]
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
  .post(validate(respondPhotoRequestSchema), photoRequestController.respondToRequest);

export default router;