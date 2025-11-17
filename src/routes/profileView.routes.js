import { Router } from 'express';
import { profileViewController } from '../controllers/profileView.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  logProfileViewSchema,
  getProfileViewsSchema,
} from '../validation/profileView.validation.js';

const router = Router();

// All view routes require authentication and a complete profile
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/view:
 * post:
 * summary: Log that you viewed another user's profile
 * tags: [Profile View]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * profileId:
 * type: integer
 * description: The userId of the profile you viewed
 * isAnonymous:
 * type: boolean
 * responses:
 * 201:
 * description: View logged successfully
 */
router
  .route('/')
  .post(validate(logProfileViewSchema), profileViewController.logProfileView);

/**
 * @swagger
 * /api/v1/view/who-viewed-me:
 * get:
 * summary: Get list of users who viewed your profile
 * tags: [Profile View]
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
 * description: List of viewers
 */
router
  .route('/who-viewed-me')
  .get(validate(getProfileViewsSchema), profileViewController.getWhoViewedMe);

/**
 * @swagger
 * /api/v1/view/my-history:
 * get:
 * summary: Get list of profiles you have viewed
 * tags: [Profile View]
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
 * description: Your view history
 */
router
  .route('/my-history')
  .get(validate(getProfileViewsSchema), profileViewController.getMyViewHistory);

export default router;