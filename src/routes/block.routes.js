import { Router } from 'express';
import { blockController } from '../controllers/block.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createBlockSchema,
  blockedUserIdParamSchema,
  getBlockedListSchema,
} from '../validation/block.validation.js';

const router = Router();

// All block routes require authentication
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/block:
 * post:
 * summary: Block a user
 * tags: [Block]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * blockedId:
 * type: integer
 * reason:
 * type: string
 * responses:
 * 201:
 * description: User blocked successfully
 * get:
 * summary: Get your list of blocked users
 * tags: [Block]
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
 * description: Your paginated list of blocked users
 */
router
  .route('/')
  .post(validate(createBlockSchema), blockController.blockUser)
  .get(validate(getBlockedListSchema), blockController.getMyBlockedList);

/**
 * @swagger
 * /api/v1/block/{blockedId}:
 * delete:
 * summary: Unblock a user
 * tags: [Block]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: blockedId
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: User unblocked successfully
 */
router
  .route('/:blockedId')
  .delete(
    validate(blockedUserIdParamSchema),
    blockController.unblockUser
  );

export default router;