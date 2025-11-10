import authService from '../services/auth.service.js';
import {logger} from '../config/logger.js';

class AuthController {
  
  async googleMobileAuth(req, res) {
    try {
      const { idToken, deviceInfo } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'ID token is required',
        });
      }

      const result = await authService.verifyGoogleToken(
        idToken,
        req.ip,
        deviceInfo || {}
      );

      return res.status(200).json({
        success: true,
        message: result.isNewUser ? 'Account created successfully' : 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
          isNewUser: result.isNewUser,
        },
      });

    } catch (error) {
      logger.error('Google auth error:', error);
      return res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed',
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const result = await authService.refreshAccessToken(refreshToken, req.ip);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        },
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      return res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.id;

      await authService.logout(userId, refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });

    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }

  async sendPhoneOTP(req, res) {
    try {
      const { phone, countryCode = '+91' } = req.body;
      const userId = req.user.id;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
      }

      await authService.sendPhoneOTP(userId, phone, countryCode);

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          expiresIn: 300,
          otpSentTo: `${countryCode}${phone}`,
        },
      });

    } catch (error) {
      logger.error('Send OTP error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to send OTP',
      });
    }
  }

  async verifyPhoneOTP(req, res) {
    try {
      const { phone, otp } = req.body;
      const userId = req.user.id;

      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and OTP are required',
        });
      }

      await authService.verifyPhoneOTP(userId, phone, otp);

      return res.status(200).json({
        success: true,
        message: 'Phone verified successfully',
      });

    } catch (error) {
      logger.error('Verify OTP error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'OTP verification failed',
      });
    }
  }
}

export default new AuthController();
