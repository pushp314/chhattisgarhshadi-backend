import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import googleAuthClient from '../config/googleAuth.js';
import jwtUtils from '../utils/jwt.js';
import smsService from './sms.service.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

class AuthService {
  
  /**
   * Verify Google authorization code (Web-Based OAuth)
   * @param {string} authorizationCode - Authorization code from Google
   * @param {string} redirectUri - Redirect URI used in OAuth flow
   * @param {string} ipAddress - User IP address
   * @param {Object} deviceInfo - Device information
   * @param {string} [agentCode] - Optional agent referral code
   * @returns {Promise<Object>} Auth result with user and tokens
   */
  async verifyGoogleAuthCode(authorizationCode, redirectUri, ipAddress, deviceInfo = {}, agentCode = null) {
    try {
      // Exchange authorization code for user info
      const googleUser = await googleAuthClient.verifyAuthorizationCode(authorizationCode, redirectUri);

      if (!googleUser.email) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Email not provided by Google');
      }

      // --- MODIFIED: Pass agentCode ---
      return await this._processGoogleAuth(googleUser, ipAddress, deviceInfo, agentCode);
    } catch (error) {
      logger.error('❌ Google authorization code verification error:', error.message);
      if (!(error instanceof ApiError)) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, error.message || 'Authorization code verification failed');
      }
      throw error;
    }
  }

  /**
   * Verify Google ID token (Legacy flow)
   * @param {string} idToken - Google ID token
   * @param {string} ipAddress - User IP address
   * @param {Object} deviceInfo - Device information
   * @param {string} [agentCode] - Optional agent referral code
   * @returns {Promise<Object>} Auth result with user and tokens
   */
  async verifyGoogleToken(idToken, ipAddress, deviceInfo = {}, agentCode = null) {
    try {
      // Verify token with Google
      const googleUser = await googleAuthClient.verifyIdToken(idToken);

      if (!googleUser.email) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Email not provided by Google');
      }

      // --- MODIFIED: Pass agentCode ---
      return await this._processGoogleAuth(googleUser, ipAddress, deviceInfo, agentCode);
    } catch (error) {
      logger.error('❌ Google auth error:', error.message);
      if (!(error instanceof ApiError)) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, error.message || 'Authentication failed');
      }
      throw error;
    }
  }

  /**
   * Common Google auth processing logic
   * @private
   */
  async _processGoogleAuth(googleUser, ipAddress, deviceInfo, agentCode = null) {
    // Check if user exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
      include: {
        profile: true,
      },
    });

    let isNewUser = false;
    let agentId = null; // --- ADDED ---

    if (!user) {
      // Check if email already exists (from another auth method)
      const existingUser = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (existingUser) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'An account with this email already exists.');
      }

      // --- ADDED: Validate Agent Code ---
      if (agentCode) {
        const agent = await prisma.agent.findUnique({
          where: { agentCode: agentCode, status: 'ACTIVE' }, // Only link to active agents
        });
        if (agent) {
          agentId = agent.id;
          logger.info(`Valid agent code ${agentCode} provided for new user ${googleUser.email}.`);
        } else {
          logger.warn(`Invalid or inactive agent code ${agentCode} provided by ${googleUser.email}.`);
        }
      }
      // --- End of Add ---

      // Create new user
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.googleId,
          authProvider: 'GOOGLE',
          profilePicture: googleUser.picture,
          // isEmailVerified and emailVerifiedAt are set by default in schema.prisma
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
          deviceInfo: JSON.stringify(deviceInfo),

          // --- ADDED: Link to agent if code was valid ---
          agentId: agentId,
          agentCodeUsed: agentId ? agentCode : null,
          referredAt: agentId ? new Date() : null,
          // --- End of Add ---
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
      throw new ApiError(HTTP_STATUS.FORBIDDEN, `Account suspended: ${user.banReason || 'Contact support'}`);
    }

    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Account is inactive');
    }

    // Generate JWT tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        deviceId: deviceInfo?.deviceId || null,
        deviceName: deviceInfo?.deviceName || null,
        deviceType: deviceInfo?.deviceType || null,
        ipAddress,
        userAgent: deviceInfo?.userAgent || null,
        expiresAt: refreshExpiresAt,
      },
    });

    // Clean response
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName || null,
      lastName: user.profile?.lastName || null,
      profilePicture: user.profilePicture,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isActive: user.isActive,
      preferredLanguage: user.preferredLanguage,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userResponse,
      accessToken,
      refreshToken,
      isNewUser,
    };
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
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token');
      }

      // Check if user is active
      if (!tokenRecord.user.isActive || tokenRecord.user.isBanned) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Account is not active');
      }

      // Generate new tokens
      const newAccessToken = jwtUtils.generateAccessToken(tokenRecord.user);
      const newRefreshToken = jwtUtils.generateRefreshToken(tokenRecord.user);
      const newRefreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Revoke old refresh token and create new one in a transaction
      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        }),
        prisma.refreshToken.create({
          data: {
            userId: tokenRecord.userId,
            token: newRefreshToken,
            deviceId: tokenRecord.deviceId,
            deviceName: tokenRecord.deviceName,
            deviceType: tokenRecord.deviceType,
            ipAddress,
            userAgent: tokenRecord.userAgent,
            expiresAt: newRefreshExpiresAt,
          },
        })
      ]);

      logger.info(`✅ Token refreshed for user ${tokenRecord.userId}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };

    } catch (error) {
      logger.error('❌ Refresh token error:', error.message);
      if (!(error instanceof ApiError)) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, error.message || 'Token refresh failed');
      }
      throw error;
    }
  }

  async logout(userId, refreshToken) {
    try {
      if (refreshToken) {
        // Revoke only the specific refresh token
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
        // Revoke all refresh tokens for the user (logout all devices)
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
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Logout failed');
    }
  }

  async sendPhoneOTP(userId, phone, countryCode = '+91') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      if (user.isPhoneVerified) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Phone already verified');
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
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Phone number already registered');
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Upsert the OTP record: delete old ones and create new one in a transaction
      await prisma.$transaction([
        prisma.phoneVerification.deleteMany({
          where: { userId },
        }),
        prisma.phoneVerification.create({
          data: {
            userId,
            phone,
            countryCode,
            otpHash,
            expiresAt,
          },
        })
      ]);

      // Send OTP via SMS
      await smsService.sendOTP(phone, otp, countryCode);

      logger.info(`✅ OTP sent to ${countryCode}${phone} for user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('❌ Send OTP error:', error.message);
      if (!(error instanceof ApiError)) {
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Failed to send OTP');
      }
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
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP expired or not found');
      }

      // Check attempts
      if (otpRecord.attempts >= 3) { // 3 attempts is a good limit
        throw new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, 'Maximum OTP attempts exceeded');
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

        const attemptsRemaining = 3 - (otpRecord.attempts + 1);
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid OTP. ${attemptsRemaining} attempts remaining.`);
      }

      // Mark as verified
      await prisma.$transaction([
        prisma.phoneVerification.update({
          where: { id: otpRecord.id },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            phone,
            countryCode: otpRecord.countryCode,
            isPhoneVerified: true,
            phoneVerifiedAt: new Date(),
          },
        })
      ]);

      logger.info(`✅ Phone verified for user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('❌ Verify OTP error:', error.message);
      if (!(error instanceof ApiError)) {
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'OTP verification failed');
      }
      throw error;
    }
  }
}

export default new AuthService();