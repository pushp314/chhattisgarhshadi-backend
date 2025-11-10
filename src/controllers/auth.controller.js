import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { authService } from '../services/auth.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Google OAuth callback handler
 * This is called by Passport after successful Google authentication
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const result = await authService.authenticateWithGoogle(req.user);

  // Set cookies
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, SUCCESS_MESSAGES.LOGIN_SUCCESS)
  );
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || req.cookies;

  if (!refreshToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token required');
  }

  const tokens = await authService.refreshAccessToken(refreshToken);

  // Update cookies
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, tokens, 'Token refreshed successfully')
  );
});

/**
 * Logout
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || req.cookies;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS)
  );
});

/**
 * Logout from all devices
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAllDevices(req.user.id);

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Logged out from all devices')
  );
});

/**
 * Get current user
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    profile: req.user.profile,
    createdAt: req.user.createdAt,
  };

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, user, 'User retrieved successfully')
  );
});

export const authController = {
  googleCallback,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
};
