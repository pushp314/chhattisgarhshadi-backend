import authService from '../services/auth.service.js';
// import { logger } from '../config/logger.js'; // <-- REMOVED
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

class AuthController {
  
  googleMobileAuth = asyncHandler(async (req, res) => {
    const { idToken, deviceInfo } = req.body;

    const result = await authService.verifyGoogleToken(
      idToken,
      req.ip,
      deviceInfo || {}
    );

    const message = result.isNewUser ? 'Account created successfully' : 'Login successful';
    const data = {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
      isNewUser: result.isNewUser,
    };

    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, message));
  });

  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken, req.ip);

    const data = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    };

    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, 'Token refreshed successfully'));
  });

  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    await authService.logout(userId, refreshToken);

    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Logged out successfully'));
  });

  sendPhoneOTP = asyncHandler(async (req, res) => {
    const { phone, countryCode } = req.body;
    const userId = req.user.id;

    await authService.sendPhoneOTP(userId, phone, countryCode);

    const data = {
      expiresIn: 300, // 5 minutes
      otpSentTo: `${countryCode || '+91'}${phone}`,
    };

    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, 'OTP sent successfully'));
  });

  verifyPhoneOTP = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;
    const userId = req.user.id;

    await authService.verifyPhoneOTP(userId, phone, otp);

    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Phone verified successfully'));
  });
}

export default new AuthController();