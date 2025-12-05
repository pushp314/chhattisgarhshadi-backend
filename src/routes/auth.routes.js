import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  googleMobileAuthSchema,
  refreshTokenSchema,
  logoutSchema,
  verifyFirebasePhoneSchema,
} from '../validation/auth.validation.js';

const router = Router();

// Rate limiter removed for authentication routes


router.post(
  '/google',
  validate(googleMobileAuthSchema),
  authController.googleMobileAuth
);

router.get(
  '/google/callback',
  authController.googleCallback
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  authController.logout
);

// Firebase Phone Verification (replaces MSG91 OTP)
router.post(
  '/phone/verify-firebase',
  authenticate,
  validate(verifyFirebasePhoneSchema),
  authController.verifyFirebasePhone
);

export default router;