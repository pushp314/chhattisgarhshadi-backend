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

router
  .route('/')
  .post(validate(createBlockSchema), blockController.blockUser)
  .get(validate(getBlockedListSchema), blockController.getMyBlockedList);

router
  .route('/:blockedId')
  .delete(
    validate(blockedUserIdParamSchema),
    blockController.unblockUser
  );

export default router;