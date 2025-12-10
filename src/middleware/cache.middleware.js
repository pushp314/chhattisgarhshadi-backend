/**
 * Cache Middleware
 * Automatically caches GET responses and serves from cache when available
 */

import { cacheService } from '../services/cache.service.js';
import { isRedisConnected } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * Create cache middleware for a route
 * @param {Object} options - Cache options
 * @param {string} options.prefix - Cache key prefix
 * @param {number} options.ttl - Time to live in seconds
 * @param {Function} options.keyGenerator - Function to generate cache key from req
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (options = {}) => {
    const {
        prefix = 'api:',
        ttl = 300, // 5 minutes default
        keyGenerator = null,
    } = options;

    return async (req, res, next) => {
        // Skip caching if Redis is not connected
        if (!isRedisConnected()) {
            return next();
        }

        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key
        const cacheKey = keyGenerator
            ? keyGenerator(req)
            : `${prefix}${req.originalUrl}`;

        try {
            // Try to get from cache
            const cachedData = await cacheService.get(cacheKey);

            if (cachedData) {
                // Add cache header
                res.set('X-Cache', 'HIT');
                return res.json(cachedData);
            }

            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to cache the response
            res.json = (data) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cacheService.set(cacheKey, data, ttl).catch((err) => {
                        logger.error('Cache middleware set error:', err.message);
                    });
                }

                // Add cache header
                res.set('X-Cache', 'MISS');

                // Call original json method
                return originalJson(data);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', error.message);
            next();
        }
    };
};

/**
 * Pre-configured cache middleware for common use cases
 */

// Cache subscription plans for 1 hour
export const cachePlans = cacheMiddleware({
    prefix: 'plans:',
    ttl: 3600,
    keyGenerator: (req) => 'plans:all',
});

// Cache profile data for 5 minutes
export const cacheProfile = cacheMiddleware({
    prefix: 'profile:',
    ttl: 300,
    keyGenerator: (req) => `profile:${req.params.userId || req.user?.id}`,
});

// Cache match suggestions for 10 minutes
export const cacheMatches = cacheMiddleware({
    prefix: 'matches:',
    ttl: 600,
    keyGenerator: (req) => `matches:${req.user?.id}:${req.query.page || 1}`,
});

// Cache dashboard stats for 2 minutes
export const cacheStats = cacheMiddleware({
    prefix: 'stats:',
    ttl: 120,
    keyGenerator: (req) => `stats:${req.user?.id}`,
});

// Cache short-lived data (1 minute)
export const cacheShort = cacheMiddleware({
    prefix: 'short:',
    ttl: 60,
});

export default {
    cacheMiddleware,
    cachePlans,
    cacheProfile,
    cacheMatches,
    cacheStats,
    cacheShort,
};
