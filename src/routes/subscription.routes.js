import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { getPlansSchema } from '../validation/subscription.validation.js';

const router = Router();

// All plan routes require authentication
// We don't require a complete profile, as users might
// want to see plans before finishing their profile.
router.use(authenticate);

router
  .route('/')
  .get(validate(getPlansSchema), subscriptionController.getActivePlans);

export default router;