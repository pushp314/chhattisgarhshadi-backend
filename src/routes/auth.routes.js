import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { authLimiter, otpLimiter } from '../middleware/auth.rate-limiter.js';
import {
  googleMobileAuthSchema,
  refreshTokenSchema,
  logoutSchema,
  sendPhoneOTPSchema,
  verifyPhoneOTPSchema,
} from '../validation/auth.validation.js';

const router = Router();

// Apply a strict rate limiter to all auth routes
router.use(authLimiter);

// Google Sign-In (Mobile)
router.post(
  '/google',
  validate(googleMobileAuthSchema),
  authController.googleMobileAuth
);

// Token Management
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

// Phone Verification
router.post(
  '/phone/send-otp',
  authenticate,
  otpLimiter, // Apply an even stricter limiter for OTP sending
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