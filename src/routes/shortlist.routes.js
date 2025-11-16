import { Router } from 'express';
import { shortlistController } from '../controllers/shortlist.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createShortlistSchema,
  shortlistedUserIdParamSchema,
  getShortlistSchema,
} from '../validation/shortlist.validation.js';

const router = Router();

// All shortlist routes require authentication and a complete profile
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/shortlist:
 * post:
 * summary: Add a user to your shortlist
 * tags: [Shortlist]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * shortlistedUserId:
 * type: integer
 * note:
 * type: string
 * responses:
 * 201:
 * description: User added to shortlist
 * get:
 * summary: Get your complete shortlist
 * tags: [Shortlist]
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
 * description: Your paginated shortlist
 */
router
  .route('/')
  .post(validate(createShortlistSchema), shortlistController.addToShortlist)
  .get(validate(getShortlistSchema), shortlistController.getMyShortlist);

/**
 * @swagger
 * /api/v1/shortlist/{shortlistedUserId}:
 * delete:
 * summary: Remove a user from your shortlist
 * tags: [Shortlist]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: shortlistedUserId
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: User removed from shortlist
 */
router
  .route('/:shortlistedUserId')
  .delete(
    validate(shortlistedUserIdParamSchema),
    shortlistController.removeFromShortlist
  );

export default router;