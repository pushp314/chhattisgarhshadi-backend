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

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     summary: Google Sign-In (Mobile OAuth)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token (legacy flow)
 *               authorizationCode:
 *                 type: string
 *                 description: Google authorization code (new flow)
 *               redirectUri:
 *                 type: string
 *                 example: com.chhattisgarhshaadi.app://oauth2redirect
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *                     isNewUser:
 *                       type: boolean
 */
router.post(
  '/google',
  validate(googleMobileAuthSchema),
  authController.googleMobileAuth
);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth Callback
 *     tags: [Authentication]
 *     description: Handles redirect from Google OAuth (InAppBrowser flow)
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirects to app with tokens
 */
router.get(
  '/google/callback',
  authController.googleCallback
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  authController.logout
);

/**
 * @swagger
 * /api/v1/auth/phone/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
  '/phone/send-otp',
  authenticate,
  otpLimiter,
  validate(sendPhoneOTPSchema),
  authController.sendPhoneOTP
);

/**
 * @swagger
 * /api/v1/auth/phone/verify-otp:
 *   post:
 *     summary: Verify phone OTP
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 */
router.post(
  '/phone/verify-otp',
  authenticate,
  validate(verifyPhoneOTPSchema),
  authController.verifyPhoneOTP
);

export default router;