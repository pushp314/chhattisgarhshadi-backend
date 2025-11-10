import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES } from '../utils/constants.js';
import prisma from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Authenticate user with JWT token
 * Extracts token from Authorization header or cookies
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // Extract token from Authorization header or cookies
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      include: { profile: true },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
  }
});

/**
 * Authorize user based on roles
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }

    next();
  });
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Check if user is premium user or admin
 */
export const isPremiumOrAdmin = authorize(USER_ROLES.PREMIUM_USER, USER_ROLES.ADMIN);

/**
 * Optional authentication - does not throw error if token is missing
 * Useful for routes that work differently for authenticated vs non-authenticated users
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies?.accessToken;

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      include: { profile: true },
    });

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
});

/**
 * Check if user has completed profile
 */
export const requireCompleteProfile = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
  }

  if (!req.user.profile) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Please complete your profile to access this resource'
    );
  }

  next();
});
