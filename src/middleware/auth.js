import jwtUtils from '../utils/jwt.js';
import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Authenticate user with JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required',
      });
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
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive || user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    logger.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
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
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if profile exists
    if (!req.user.profile) {
      return res.status(403).json({
        success: false,
        message: 'Profile not found. Please create your profile first.',
      });
    }

    // Check profile completeness (you can adjust the threshold)
    const profileCompleteness = req.user.profile.profileCompleteness || 0;
    
    if (profileCompleteness < 50) {
      return res.status(403).json({
        success: false,
        message: 'Please complete your profile to access this feature',
        data: {
          profileCompleteness,
          requiredCompleteness: 50,
        },
      });
    }

    next();

  } catch (error) {
    logger.error('Profile check error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error checking profile status',
    });
  }
};

/**
 * Require user to have verified phone
 */
export const requirePhoneVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!req.user.isPhoneVerified) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification required to access this feature',
      });
    }

    next();

  } catch (error) {
    logger.error('Phone verification check error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error checking phone verification status',
    });
  }
};

/**
 * Require user to have active subscription
 */
export const requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
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
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this feature',
        requiresSubscription: true,
      });
    }

    // Attach subscription to request
    req.subscription = activeSubscription;
    next();

  } catch (error) {
    logger.error('Subscription check error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription status',
    });
  }
};

/**
 * Check if user has admin role
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();

  } catch (error) {
    logger.error('Admin check error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status',
    });
  }
};