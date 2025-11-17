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

/**
 * @swagger
 * /api/v1/plans:
 * get:
 * summary: Get all active subscription plans
 * tags: [Subscription Plans]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: A paginated list of active subscription plans
 */
router
  .route('/')
  .get(validate(getPlansSchema), subscriptionController.getActivePlans);

export default router;