import express from 'express';
const router = express.Router();
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

// Google Sign-In (Mobile)
router.post('/google', authController.googleMobileAuth);

// Token Management
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

// Phone Verification
router.post('/phone/send-otp', authenticate, authController.sendPhoneOTP);
router.post('/phone/verify-otp', authenticate, authController.verifyPhoneOTP);

export default router;