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

// This specific route requires a subscription
router
  .route('/')
  .post(
    requireSubscription, // <-- Added subscription check
    validate(createPhotoRequestSchema), 
    photoRequestController.createPhotoRequest
  );

router
  .route('/sent')
  .get(validate(getPhotoRequestsSchema), photoRequestController.getSentRequests);


router
  .route('/received')
  .get(validate(getPhotoRequestsSchema), photoRequestController.getReceivedRequests);

router
  .route('/:id/respond')
  .post(validate(respondPhotoRequestSchema), photoRequestController.respondToRequest);

export default router;