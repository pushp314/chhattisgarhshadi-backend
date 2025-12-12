/**
 * Token Blacklist Service
 * Uses Redis to store invalidated JWT tokens until they expire
 * Provides secure logout by preventing token reuse
 */

import { createClient } from 'ioredis';
import { logger } from '../config/logger.js';
import { config } from '../config/config.js';

// Redis client for token blacklist
let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection for token blacklisting
 */
export const initializeBlacklist = async () => {
    try {
        // Use existing Redis URL or fallback
        const redisUrl = config.REDIS_URL || process.env.REDIS_URL;

        if (!redisUrl) {
            logger.warn('⚠️ REDIS_URL not configured. Token blacklisting will use in-memory fallback.');
            return false;
        }

        redisClient = createClient(redisUrl);

        redisClient.on('connect', () => {
            isConnected = true;
            logger.info('✅ Token blacklist Redis connected');
        });

        redisClient.on('error', (err) => {
            logger.error('Redis blacklist error:', err);
            isConnected = false;
        });

        await redisClient.connect();
        return true;
    } catch (error) {
        logger.error('Failed to initialize token blacklist:', error);
        return false;
    }
};

// In-memory fallback when Redis is not available
const memoryBlacklist = new Map();

/**
 * Add a token to the blacklist
 * @param {string} token - The JWT token to blacklist
 * @param {number} expiresInSeconds - Time until token expires naturally
 */
export const blacklistToken = async (token, expiresInSeconds = 86400) => {
    const key = `blacklist:${token}`;

    try {
        if (isConnected && redisClient) {
            await redisClient.setex(key, expiresInSeconds, 'blacklisted');
            logger.debug(`Token blacklisted in Redis for ${expiresInSeconds}s`);
        } else {
            // In-memory fallback
            memoryBlacklist.set(key, Date.now() + (expiresInSeconds * 1000));
            cleanupMemoryBlacklist();
            logger.debug(`Token blacklisted in memory for ${expiresInSeconds}s`);
        }
        return true;
    } catch (error) {
        logger.error('Error blacklisting token:', error);
        return false;
    }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - The JWT token to check
 * @returns {Promise<boolean>} True if blacklisted
 */
export const isTokenBlacklisted = async (token) => {
    const key = `blacklist:${token}`;

    try {
        if (isConnected && redisClient) {
            const result = await redisClient.get(key);
            return result !== null;
        } else {
            // In-memory fallback
            const expiry = memoryBlacklist.get(key);
            if (expiry && expiry > Date.now()) {
                return true;
            }
            memoryBlacklist.delete(key);
            return false;
        }
    } catch (error) {
        logger.error('Error checking token blacklist:', error);
        return false; // Fail open to not block users
    }
};

/**
 * Blacklist all tokens for a user (logout from all devices)
 * @param {number} userId - User ID
 * @param {number} expiresInSeconds - Time until tokens expire
 */
export const blacklistAllUserTokens = async (userId, expiresInSeconds = 86400) => {
    const key = `blacklist:user:${userId}`;

    try {
        if (isConnected && redisClient) {
            await redisClient.setex(key, expiresInSeconds, Date.now().toString());
            logger.info(`All tokens for user ${userId} blacklisted`);
        } else {
            memoryBlacklist.set(key, Date.now() + (expiresInSeconds * 1000));
        }
        return true;
    } catch (error) {
        logger.error('Error blacklisting user tokens:', error);
        return false;
    }
};

/**
 * Check if user's tokens are globally blacklisted
 * @param {number} userId - User ID
 * @param {number} tokenIssuedAt - Token issue timestamp (iat claim)
 * @returns {Promise<boolean>} True if user tokens blacklisted after token was issued
 */
export const isUserTokenBlacklisted = async (userId, tokenIssuedAt) => {
    const key = `blacklist:user:${userId}`;

    try {
        if (isConnected && redisClient) {
            const blacklistedAt = await redisClient.get(key);
            if (blacklistedAt) {
                return parseInt(blacklistedAt) > (tokenIssuedAt * 1000);
            }
        } else {
            const blacklistedAt = memoryBlacklist.get(key);
            if (blacklistedAt && blacklistedAt > Date.now()) {
                return true;
            }
        }
        return false;
    } catch (error) {
        logger.error('Error checking user token blacklist:', error);
        return false;
    }
};

/**
 * Cleanup expired entries from memory blacklist
 */
const cleanupMemoryBlacklist = () => {
    const now = Date.now();
    for (const [key, expiry] of memoryBlacklist.entries()) {
        if (expiry < now) {
            memoryBlacklist.delete(key);
        }
    }
};

/**
 * Get blacklist statistics
 */
export const getBlacklistStats = async () => {
    try {
        if (isConnected && redisClient) {
            const keys = await redisClient.keys('blacklist:*');
            return {
                provider: 'redis',
                count: keys.length,
                connected: true,
            };
        } else {
            cleanupMemoryBlacklist();
            return {
                provider: 'memory',
                count: memoryBlacklist.size,
                connected: false,
            };
        }
    } catch (error) {
        return {
            provider: 'unknown',
            count: 0,
            error: error.message,
        };
    }
};

export default {
    initializeBlacklist,
    blacklistToken,
    isTokenBlacklisted,
    blacklistAllUserTokens,
    isUserTokenBlacklisted,
    getBlacklistStats,
};
