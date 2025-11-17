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

router
  .route('/')
  .post(validate(logProfileViewSchema), profileViewController.logProfileView);


router
  .route('/who-viewed-me')
  .get(validate(getProfileViewsSchema), profileViewController.getWhoViewedMe);


router
  .route('/my-history')
  .get(validate(getProfileViewsSchema), profileViewController.getMyViewHistory);

export default router;