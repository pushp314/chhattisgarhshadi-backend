const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Google Sign-In (Mobile)
router.post('/google', authController.googleMobileAuth);

// Token Management
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

// Phone Verification
router.post('/phone/send-otp', authenticate, authController.sendPhoneOTP);
router.post('/phone/verify-otp', authenticate, authController.verifyPhoneOTP);

module.exports = router;