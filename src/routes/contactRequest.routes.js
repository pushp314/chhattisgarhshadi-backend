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


// This specific route requires a subscription
router
  .route('/')
  .post(
    requireSubscription, // <-- Added subscription check
    validate(createContactRequestSchema), 
    contactRequestController.createContactRequest
  );


router
  .route('/sent')
  .get(validate(getContactRequestsSchema), contactRequestController.getSentRequests);


router
  .route('/received')
  .get(validate(getContactRequestsSchema), contactRequestController.getReceivedRequests);


router
  .route('/:id/respond')
  .post(validate(respondContactRequestSchema), contactRequestController.respondToRequest);

export default router;