import authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

class AuthController {
  
  googleMobileAuth = asyncHandler(async (req, res) => {
    const { idToken, authorizationCode, redirectUri, deviceInfo } = req.body;

    let result;

    // Support both flows: Web-Based OAuth (authorizationCode) and Legacy (idToken)
    if (authorizationCode) {
      // Web-Based OAuth flow (NEW)
      result = await authService.verifyGoogleAuthCode(
        authorizationCode,
        redirectUri || 'com.chhattisgarhshaadi.app://oauth2redirect',
        req.ip,
        deviceInfo || {}
      );
    } else if (idToken) {
      // Legacy idToken flow (BACKWARD COMPATIBILITY)
      result = await authService.verifyGoogleToken(
        idToken,
        req.ip,
        deviceInfo || {}
      );
    } else {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Either authorizationCode or idToken is required');
    }

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

  googleCallback = asyncHandler(async (req, res) => {
    const { code, state, error } = req.query;

    // Handle OAuth error from Google
    if (error) {
      const errorMessage = error === 'access_denied' 
        ? 'User cancelled the authentication' 
        : `Authentication failed: ${error}`;
      
      // Redirect to app with error
      const appDeepLink = `com.chhattisgarhshaadi.app://oauth-error?error=${encodeURIComponent(errorMessage)}`;
      return res.redirect(appDeepLink);
    }

    // Validate authorization code
    if (!code) {
      const appDeepLink = 'com.chhattisgarhshaadi.app://oauth-error?error=Authorization+code+missing';
      return res.redirect(appDeepLink);
    }

    try {
      // Exchange authorization code for user info and tokens
      const redirectUri = process.env.GOOGLE_CALLBACK_URL || 
                          `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;
      
      const result = await authService.verifyGoogleAuthCode(
        code,
        redirectUri,
        req.ip,
        { userAgent: req.get('user-agent') }
      );

      // Redirect to app with tokens via deep link
      const appDeepLink = `com.chhattisgarhshaadi.app://oauth-success?` +
        `accessToken=${encodeURIComponent(result.accessToken)}&` +
        `refreshToken=${encodeURIComponent(result.refreshToken)}&` +
        `isNewUser=${result.isNewUser}`;
      
      return res.redirect(appDeepLink);

    } catch (error) {
      // Redirect to app with error
      const errorMessage = error.message || 'Authentication failed';
      const appDeepLink = `com.chhattisgarhshaadi.app://oauth-error?error=${encodeURIComponent(errorMessage)}`;
      return res.redirect(appDeepLink);
    }
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