const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const googleAuthClient = require('../config/googleAuth');
const jwtUtils = require('../utils/jwt');
const smsService = require('./sms.service');
const logger = require('../config/logger');

class AuthService {
  
  async verifyGoogleToken(idToken, ipAddress, deviceInfo = {}) {
    try {
      // Verify token with Google
      const googleUser = await googleAuthClient.verifyIdToken(idToken);

      if (!googleUser.email) {
        throw new Error('Email not provided by Google');
      }

      // Check if user exists by googleId
      let user = await prisma.user.findUnique({
        where: { googleId: googleUser.googleId },
        include: {
          profile: true,
        },
      });

      let isNewUser = false;

      if (!user) {
        // Check if email already exists (from another auth method)
        const existingUser = await prisma.user.findUnique({
          where: { email: googleUser.email },
        });

        if (existingUser) {
          throw new Error('Email already registered with different method');
        }

        // Create new user
        isNewUser = true;
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.googleId,
            authProvider: 'GOOGLE',
            profilePicture: googleUser.picture,
            isEmailVerified: googleUser.emailVerified,
            emailVerifiedAt: googleUser.emailVerified ? new Date() : null,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
            deviceInfo: JSON.stringify(deviceInfo),
          },
          include: {
            profile: true,
          },
        });

        logger.info(`✅ New user created: ${googleUser.email} (ID: ${user.id})`);
      } else {
        // Update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
            deviceInfo: JSON.stringify(deviceInfo),
          },
          include: {
            profile: true,
          },
        });

        logger.info(`✅ User logged in: ${googleUser.email} (ID: ${user.id})`);
      }

      // Check if account is banned
      if (user.isBanned) {
        throw new Error(`Account suspended: ${user.banReason || 'Contact support'}`);
      }

      if (!user.isActive) {
        throw new Error('Account is inactive');
      }

      // Generate JWT tokens
      const accessToken = jwtUtils.generateAccessToken(user);
      const refreshToken = jwtUtils.generateRefreshToken(user);

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          deviceId: deviceInfo.deviceId || null,
          deviceName: deviceInfo.deviceName || null,
          deviceType: deviceInfo.deviceType || null,
          ipAddress,
          userAgent: deviceInfo.userAgent || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Clean response
      const userResponse = {
        id: user.id,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        preferredLanguage: user.preferredLanguage,
        profile: user.profile,
      };

      return {
        user: userResponse,
        accessToken,
        refreshToken,
        isNewUser,
      };

    } catch (error) {
      logger.error('❌ Google auth error:', error.message);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken, ipAddress) {
    try {
      // Verify refresh token
      const decoded = jwtUtils.verifyRefreshToken(refreshToken);

      // Check if token exists in database
      const tokenRecord = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.id,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      if (!tokenRecord) {
        throw new Error('Invalid or expired refresh token');
      }

      // Check if user is active
      if (!tokenRecord.user.isActive || tokenRecord.user.isBanned) {
        throw new Error('Account is not active');
      }

      // Generate new tokens
      const newAccessToken = jwtUtils.generateAccessToken(tokenRecord.user);
      const newRefreshToken = jwtUtils.generateRefreshToken(tokenRecord.user);

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // Store new refresh token
      await prisma.refreshToken.create({
        data: {
          userId: tokenRecord.userId,
          token: newRefreshToken,
          deviceId: tokenRecord.deviceId,
          deviceName: tokenRecord.deviceName,
          deviceType: tokenRecord.deviceType,
          ipAddress,
          userAgent: tokenRecord.userAgent,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      logger.info(`✅ Token refreshed for user ${tokenRecord.userId}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };

    } catch (error) {
      logger.error('❌ Refresh token error:', error.message);
      throw error;
    }
  }

  async logout(userId, refreshToken) {
    try {
      if (refreshToken) {
        await prisma.refreshToken.updateMany({
          where: {
            userId,
            token: refreshToken,
          },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        });
      } else {
        // Revoke all tokens
        await prisma.refreshToken.updateMany({
          where: { userId },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        });
      }

      logger.info(`✅ User ${userId} logged out`);
    } catch (error) {
      logger.error('❌ Logout error:', error.message);
      throw error;
    }
  }

  async sendPhoneOTP(userId, phone, countryCode = '+91') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isPhoneVerified) {
        throw new Error('Phone already verified');
      }

      // Check if phone exists for another user
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone,
          isPhoneVerified: true,
          id: { not: userId },
        },
      });

      if (existingPhone) {
        throw new Error('Phone number already registered');
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);

      // Delete old OTP records
      await prisma.phoneVerification.deleteMany({
        where: { userId },
      });

      // Create new OTP record
      await prisma.phoneVerification.create({
        data: {
          userId,
          phone,
          countryCode,
          otpHash,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
      });

      // Send OTP via SMS
      await smsService.sendOTP(phone, otp, countryCode);

      logger.info(`✅ OTP sent to ${countryCode}${phone} for user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('❌ Send OTP error:', error.message);
      throw error;
    }
  }

  async verifyPhoneOTP(userId, phone, otp) {
    try {
      // Find OTP record
      const otpRecord = await prisma.phoneVerification.findFirst({
        where: {
          userId,
          phone,
          isVerified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpRecord) {
        throw new Error('OTP expired or not found');
      }

      if (otpRecord.attempts >= 3) {
        throw new Error('Maximum OTP attempts exceeded');
      }

      // Verify OTP
      const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

      if (!isValid) {
        await prisma.phoneVerification.update({
          where: { id: otpRecord.id },
          data: {
            attempts: otpRecord.attempts + 1,
          },
        });

        throw new Error(`Invalid OTP. ${2 - otpRecord.attempts} attempts remaining`);
      }

      // Mark as verified
      await prisma.phoneVerification.update({
        where: { id: otpRecord.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone,
          countryCode: otpRecord.countryCode,
          isPhoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });

      logger.info(`✅ Phone verified for user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('❌ Verify OTP error:', error.message);
      throw error;
    }
  }
}

module.exports = new AuthService();