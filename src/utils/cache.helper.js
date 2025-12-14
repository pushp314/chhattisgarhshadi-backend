/**
 * Redis Cache Helper
 * Wraps Redis operations with error handling and fallbacks
 */

import { getRedisClient, isRedisConnected } from '../config/redis.js';
import { logger } from '../config/logger.js';

export const cacheHelper = {
    /**
     * Get value from cache
     * @param {string} key 
     * @returns {Promise<any|null>}
     */
    get: async (key) => {
        try {
            if (!isRedisConnected()) return null;
            const client = getRedisClient();
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.warn(`Redis Get Error [${key}]:`, error.message);
            return null;
        }
    },

    /**
     * Set value in cache
     * @param {string} key 
     * @param {any} data 
     * @param {number} ttlSeconds 
     */
    set: async (key, data, ttlSeconds = 3600) => {
        try {
            if (!isRedisConnected()) return;
            const client = getRedisClient();
            await client.setex(key, ttlSeconds, JSON.stringify(data));
        } catch (error) {
            logger.warn(`Redis Set Error [${key}]:`, error.message);
        }
    },

    /**
     * Get from cache or fetch from source
     * @param {string} key 
     * @param {Function} fetchFn 
     * @param {number} ttlSeconds 
     * @returns {Promise<any>}
     */
    getOrFetch: async (key, fetchFn, ttlSeconds = 3600) => {
        // 1. Try Cache
        const cached = await cacheHelper.get(key);
        if (cached) {
            return cached;
        }

        // 2. Fetch from Source
        const data = await fetchFn();

        // 3. Set Cache (non-blocking)
        if (data) {
            cacheHelper.set(key, data, ttlSeconds);
        }

        return data;
    },

    /**
     * Delete from cache
     * @param {string} key 
     */
    del: async (key) => {
        try {
            if (!isRedisConnected()) return;
            const client = getRedisClient();
            await client.del(key);
        } catch (error) {
            logger.warn(`Redis Del Error [${key}]:`, error.message);
        }
    }
};
