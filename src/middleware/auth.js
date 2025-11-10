const jwtUtils = require('../utils/jwt');
const prisma = require('../config/database');
const logger = require('../config/logger');

const authenticate = async (req, res, next) => {
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

const optionalAuth = async (req, res, next) => {
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

module.exports = {
  authenticate,
  optionalAuth,
};