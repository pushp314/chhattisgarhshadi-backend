/**
 * Cache Service
 * Provides helper functions for Redis caching operations
 */

import { getRedisClient, isRedisConnected } from '../config/redis.js';
import { logger } from '../config/logger.js';

// Cache key prefixes for organization
const CACHE_PREFIXES = {
    PROFILE: 'profile:',
    USER: 'user:',
    PLANS: 'plans:',
    MATCHES: 'matches:',
    STATS: 'stats:',
    SESSION: 'session:',
};

// Default TTL values (in seconds)
const DEFAULT_TTL = {
    PROFILE: 300,      // 5 minutes
    USER: 600,         // 10 minutes
    PLANS: 3600,       // 1 hour (rarely changes)
    MATCHES: 600,      // 10 minutes
    STATS: 120,        // 2 minutes
    SHORT: 60,         // 1 minute
    MEDIUM: 300,       // 5 minutes
    LONG: 3600,        // 1 hour
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Parsed data or null
 */
export const get = async (key) => {
    if (!isRedisConnected()) return null;

    try {
        const redis = getRedisClient();
        const data = await redis.get(key);

        if (data) {
            logger.debug(`Cache HIT: ${key}`);
            return JSON.parse(data);
        }

        logger.debug(`Cache MISS: ${key}`);
        return null;
    } catch (error) {
        logger.error(`Cache get error for ${key}:`, error.message);
        return null;
    }
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export const set = async (key, value, ttl = DEFAULT_TTL.MEDIUM) => {
    if (!isRedisConnected()) return false;

    try {
        const redis = getRedisClient();
        await redis.setex(key, ttl, JSON.stringify(value));
        logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
        return true;
    } catch (error) {
        logger.error(`Cache set error for ${key}:`, error.message);
        return false;
    }
};

/**
 * Delete cached data
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
export const del = async (key) => {
    if (!isRedisConnected()) return false;

    try {
        const redis = getRedisClient();
        await redis.del(key);
        logger.debug(`Cache DEL: ${key}`);
        return true;
    } catch (error) {
        logger.error(`Cache del error for ${key}:`, error.message);
        return false;
    }
};

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "profile:*")
 * @returns {Promise<number>} Number of deleted keys
 */
export const delByPattern = async (pattern) => {
    if (!isRedisConnected()) return 0;

    try {
        const redis = getRedisClient();
        const keys = await redis.keys(pattern);

        if (keys.length === 0) return 0;

        await redis.del(...keys);
        logger.info(`Cache DEL pattern "${pattern}": ${keys.length} keys deleted`);
        return keys.length;
    } catch (error) {
        logger.error(`Cache delByPattern error for ${pattern}:`, error.message);
        return 0;
    }
};

/**
 * Cache wrapper - Get or Set pattern
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fresh data
 */
export const getOrSet = async (key, fetchFn, ttl = DEFAULT_TTL.MEDIUM) => {
    // Try to get from cache
    const cached = await get(key);
    if (cached !== null) return cached;

    // Fetch fresh data
    const data = await fetchFn();

    // Cache the result
    await set(key, data, ttl);

    return data;
};

/**
 * Invalidate user-related caches when profile updates
 * @param {number} userId - User ID
 */
export const invalidateUserCache = async (userId) => {
    await delByPattern(`${CACHE_PREFIXES.PROFILE}${userId}*`);
    await delByPattern(`${CACHE_PREFIXES.USER}${userId}*`);
    await delByPattern(`${CACHE_PREFIXES.MATCHES}*${userId}*`);
    logger.info(`Cache invalidated for user: ${userId}`);
};

/**
 * Invalidate subscription plans cache
 */
export const invalidatePlansCache = async () => {
    await delByPattern(`${CACHE_PREFIXES.PLANS}*`);
    logger.info('Cache invalidated for subscription plans');
};

// Export cache key builders
export const cacheKeys = {
    profile: (userId) => `${CACHE_PREFIXES.PROFILE}${userId}`,
    profilePublic: (userId) => `${CACHE_PREFIXES.PROFILE}public:${userId}`,
    user: (userId) => `${CACHE_PREFIXES.USER}${userId}`,
    plans: () => `${CACHE_PREFIXES.PLANS}all`,
    planById: (planId) => `${CACHE_PREFIXES.PLANS}${planId}`,
    matches: (userId) => `${CACHE_PREFIXES.MATCHES}${userId}`,
    matchSuggestions: (userId, page) => `${CACHE_PREFIXES.MATCHES}suggestions:${userId}:${page}`,
    stats: (userId) => `${CACHE_PREFIXES.STATS}${userId}`,
    dashboardStats: () => `${CACHE_PREFIXES.STATS}dashboard`,
};

export const cacheService = {
    get,
    set,
    del,
    delByPattern,
    getOrSet,
    invalidateUserCache,
    invalidatePlansCache,
    cacheKeys,
    CACHE_PREFIXES,
    DEFAULT_TTL,
};

export default cacheService;
