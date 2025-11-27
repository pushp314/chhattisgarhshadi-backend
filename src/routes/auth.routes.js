import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { otpLimiter } from '../middleware/auth.rate-limiter.js';
import {
  googleMobileAuthSchema,
  refreshTokenSchema,
  logoutSchema,
  sendPhoneOTPSchema,
  verifyPhoneOTPSchema,
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


router.post(
  '/phone/send-otp',
  authenticate,
  otpLimiter,
  validate(sendPhoneOTPSchema),
  authController.sendPhoneOTP
);


router.post(
  '/phone/verify-otp',
  authenticate,
  validate(verifyPhoneOTPSchema),
  authController.verifyPhoneOTP
);

export default router;