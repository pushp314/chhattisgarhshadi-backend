import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import googleAuthClient from '../config/googleAuth.js';
import jwtUtils from '../utils/jwt.js';
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

      // Use transaction to atomically create user AND update agent stats
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the user
        const newUser = await tx.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.googleId,
            authProvider: 'GOOGLE',
            profilePicture: googleUser.picture,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
            deviceInfo: JSON.stringify(deviceInfo),
            agentId: agentId,
            agentCodeUsed: agentId ? agentCode : null,
            referredAt: agentId ? new Date() : null,
          },
          include: {
            profile: true,
          },
        });

        // 2. If agent was linked, increment their totalUsersAdded counter
        if (agentId) {
          await tx.agent.update({
            where: { id: agentId },
            data: {
              totalUsersAdded: { increment: 1 },
              activeUsers: { increment: 1 },
            },
          });
          logger.info(`Agent ${agentCode} stats updated: +1 user`);
        }

        return newUser;
      });

      user = result;
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

  /**
   * Verify Firebase Phone Auth Token and mark phone as verified
   * @param {number} userId - User ID
   * @param {string} firebaseIdToken - Firebase ID token after client-side phone verification
   * @returns {Promise<Object>}
   */
  async verifyFirebasePhone(userId, firebaseIdToken) {
    try {
      // Import Firebase Admin SDK
      const { default: admin } = await import('../config/firebase.js');

      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);

      // Extract phone number from Firebase token
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Phone number not found in Firebase token');
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      if (user.isPhoneVerified && user.phone === phoneNumber) {
        // Already verified with same phone
        return { success: true, message: 'Phone already verified' };
      }

      // Check if phone exists for another user
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: phoneNumber,
          isPhoneVerified: true,
          id: { not: userId },
        },
      });

      if (existingPhone) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Phone number already registered to another account');
      }

      // Parse country code from phone number (e.g., +91 from +919876543210)
      const countryCode = phoneNumber.substring(0, 3); // Simple extraction, may need refinement
      const localPhone = phoneNumber.substring(3);

      // Update user with verified phone
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: localPhone,
          countryCode: countryCode,
          isPhoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });

      logger.info(`✅ Firebase Phone verified for user ${userId}: ${phoneNumber}`);

      return { success: true, phone: phoneNumber };

    } catch (error) {
      logger.error('❌ Firebase phone verification error:', error.message);
      if (error.code === 'auth/id-token-expired') {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Firebase token expired. Please verify again.');
      }
      if (error.code === 'auth/argument-error') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid Firebase token format.');
      }
      if (!(error instanceof ApiError)) {
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Phone verification failed');
      }
      throw error;
    }
  }
}

export default new AuthService();