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


router
  .route('/')
  .post(validate(createShortlistSchema), shortlistController.addToShortlist)
  .get(validate(getShortlistSchema), shortlistController.getMyShortlist);


router
  .route('/:shortlistedUserId')
  .delete(
    validate(shortlistedUserIdParamSchema),
    shortlistController.removeFromShortlist
  );

export default router;