import jwtUtils from '../utils/jwt.js';
import prisma from '../config/database.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Authenticate user with JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authorization token required'));
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwtUtils.verifyAccessToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found'));
    }

    if (!user.isActive || user.isBanned) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Account is not active'));
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    logger.error('Authentication error:', error.message);
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired token'));
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwtUtils.verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          profile: true,
        },
      });

      if (user && user.isActive && !user.isBanned) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Require user to have a complete profile
 */
export const requireCompleteProfile = async (req, res, next) => {
  try {
    // User must be authenticated first
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
    }

    // Check if profile exists
    if (!req.user.profile) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Profile not found. Please create your profile first.'));
    }

    // Check profile completeness (you can adjust the threshold)
    const profileCompleteness = req.user.profile.profileCompleteness || 0;
    
    if (profileCompleteness < 50) {
      const error = new ApiError(HTTP_STATUS.FORBIDDEN, 'Please complete your profile to access this feature');
      error.data = {
        profileCompleteness,
        requiredCompleteness: 50,
      };
      return next(error);
    }

    next();

  } catch (error) {
    logger.error('Profile check error:', error.message);
    return next(new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error checking profile status'));
  }
};

/**
 * Require user to have verified phone
 */
export const requirePhoneVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
    }

    if (!req.user.isPhoneVerified) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Phone verification required to access this feature'));
    }

    next();

  } catch (error) {
    logger.error('Phone verification check error:', error.message);
    return next(new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error checking phone verification status'));
  }
};

/**
 * Require user to have active subscription
 */
export const requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
    }

    // Check for active subscription
    const activeSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'ACTIVE',
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });

    if (!activeSubscription) {
      const error = new ApiError(HTTP_STATUS.FORBIDDEN, 'Active subscription required to access this feature');
      error.data = {
        requiresSubscription: true,
      };
      return next(error);
    }

    // Attach subscription to request
    req.subscription = activeSubscription;
    next();

  } catch (error) {
    logger.error('Subscription check error:', error.message);
    return next(new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error checking subscription status'));
  }
};

/**
 * Check if user has admin role
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Admin access required'));
    }

    next();

  } catch (error) {
    logger.error('Admin check error:', error.message);
    return next(new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error checking admin status'));
  }
};