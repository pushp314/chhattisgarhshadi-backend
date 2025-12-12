/**
 * Rate Limiting Service for Notifications
 * Prevents notification spam and implements per-type rate limits
 */

import { logger } from '../config/logger.js';

// Rate limit configurations (per user)
const RATE_LIMITS = {
    MESSAGE: { max: 100, windowMs: 60 * 60 * 1000 }, // 100 messages/hour
    MATCH_REQUEST: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 requests/hour
    MATCH_ACCEPTED: { max: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
    PROFILE_VIEWED: { max: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
    SHORTLIST: { max: 30, windowMs: 60 * 60 * 1000 }, // 30/hour
    CONTACT_REQUEST: { max: 15, windowMs: 60 * 60 * 1000 }, // 15/hour
    CONTACT_ACCEPTED: { max: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
    PHOTO_REQUEST: { max: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
    PHOTO_ACCEPTED: { max: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
    PAYMENT_SUCCESS: { max: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5/day
    SUBSCRIPTION_EXPIRING: { max: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3/day
    SUBSCRIPTION_EXPIRED: { max: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3/day
    GENERAL: { max: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
};

// In-memory store for rate limiting (use Redis in production for distributed systems)
// Structure: { userId: { type: { count: number, resetAt: timestamp } } }
const rateLimitStore = new Map();

/**
 * Clean up expired entries periodically (every 5 minutes)
 */
setInterval(() => {
    const now = Date.now();
    for (const [userId, types] of rateLimitStore.entries()) {
        for (const [type, data] of Object.entries(types)) {
            if (data.resetAt < now) {
                delete types[type];
            }
        }
        if (Object.keys(types).length === 0) {
            rateLimitStore.delete(userId);
        }
    }
}, 5 * 60 * 1000);

/**
 * Check if a notification should be rate limited
 * @param {number} userId - User ID
 * @param {string} type - Notification type
 * @returns {boolean} - True if rate limited, false if allowed
 */
export const isRateLimited = (userId, type) => {
    const limit = RATE_LIMITS[type] || RATE_LIMITS.GENERAL;
    const now = Date.now();

    // Get or create user's rate limit data
    if (!rateLimitStore.has(userId)) {
        rateLimitStore.set(userId, {});
    }

    const userLimits = rateLimitStore.get(userId);

    // Get or create type-specific limit data
    if (!userLimits[type] || userLimits[type].resetAt < now) {
        userLimits[type] = {
            count: 0,
            resetAt: now + limit.windowMs,
        };
    }

    const typeLimit = userLimits[type];

    // Check if limit exceeded
    if (typeLimit.count >= limit.max) {
        logger.warn(
            `Rate limit exceeded for user ${userId}, type: ${type} ` +
            `(${typeLimit.count}/${limit.max} in ${limit.windowMs}ms)`
        );
        return true;
    }

    // Increment counter
    typeLimit.count++;
    return false;
};

/**
 * Get current rate limit status for a user and type
 * @param {number} userId - User ID
 * @param {string} type - Notification type
 * @returns {object} - { allowed: boolean, remaining: number, resetAt: timestamp }
 */
export const getRateLimitStatus = (userId, type) => {
    const limit = RATE_LIMITS[type] || RATE_LIMITS.GENERAL;
    const now = Date.now();

    if (!rateLimitStore.has(userId)) {
        return {
            allowed: true,
            remaining: limit.max,
            resetAt: now + limit.windowMs,
        };
    }

    const userLimits = rateLimitStore.get(userId);
    const typeLimit = userLimits[type];

    if (!typeLimit || typeLimit.resetAt < now) {
        return {
            allowed: true,
            remaining: limit.max,
            resetAt: now + limit.windowMs,
        };
    }

    return {
        allowed: typeLimit.count < limit.max,
        remaining: Math.max(0, limit.max - typeLimit.count),
        resetAt: typeLimit.resetAt,
    };
};

/**
 * Reset rate limit for a user (admin function)
 * @param {number} userId - User ID
 * @param {string} [type] - Optional specific type to reset
 */
export const resetRateLimit = (userId, type = null) => {
    if (!rateLimitStore.has(userId)) {
        return;
    }

    if (type) {
        const userLimits = rateLimitStore.get(userId);
        delete userLimits[type];
        logger.info(`Rate limit reset for user ${userId}, type: ${type}`);
    } else {
        rateLimitStore.delete(userId);
        logger.info(`All rate limits reset for user ${userId}`);
    }
};

/**
 * Get rate limit configuration
 * @returns {object} - Rate limit configurations
 */
export const getRateLimitConfig = () => {
    return { ...RATE_LIMITS };
};

export default {
    isRateLimited,
    getRateLimitStatus,
    resetRateLimit,
    getRateLimitConfig,
};
