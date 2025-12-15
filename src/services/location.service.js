/**
 * Location Service
 * Handles PIN code to location resolution with PostgreSQL caching
 * 
 * Flow:
 * 1. Validate PIN code format
 * 2. Check PostgreSQL cache
 * 3. If miss, call India Post API
 * 4. Cache result in DB
 * 5. Return location data
 */

import prisma from '../config/database.js';
import axios from 'axios';

// India Post API base URL
const INDIA_POST_API = 'https://api.postalpincode.in/pincode';

// Request timeout for external API
const API_TIMEOUT = 5000; // 5 seconds

/**
 * Validate Indian PIN code format
 * @param {string} pincode 
 * @returns {boolean}
 */
export const isValidPincode = (pincode) => {
    if (!pincode || typeof pincode !== 'string') return false;
    // Must be exactly 6 digits
    return /^[1-9][0-9]{5}$/.test(pincode);
};

/**
 * Get location data from India Post API
 * @param {string} pincode 
 * @returns {Promise<{city: string, district: string, state: string} | null>}
 */
const fetchFromIndiaPostAPI = async (pincode) => {
    const startTime = Date.now();

    try {
        const response = await axios.get(`${INDIA_POST_API}/${pincode}`, {
            timeout: API_TIMEOUT,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ChhattisgarhShaadi/1.0'
            }
        });

        const responseTime = Date.now() - startTime;
        console.log(`[Location Service] India Post API response time: ${responseTime}ms`);

        const data = response.data;

        // API returns array with single object
        if (!Array.isArray(data) || data.length === 0) {
            console.warn(`[Location Service] Invalid API response format for PIN: ${pincode}`);
            return null;
        }

        const result = data[0];

        // Check if API returned success
        if (result.Status !== 'Success' || !result.PostOffice || result.PostOffice.length === 0) {
            console.warn(`[Location Service] No data found for PIN: ${pincode}`);
            return null;
        }

        // Extract first post office (most relevant)
        const postOffice = result.PostOffice[0];

        return {
            city: postOffice.Name || postOffice.Block || postOffice.District,
            district: postOffice.District,
            state: postOffice.State
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error(`[Location Service] India Post API error after ${responseTime}ms:`, error.message);
        return null;
    }
};

/**
 * Get location by PIN code
 * First checks PostgreSQL cache, then falls back to India Post API
 * 
 * @param {string} pincode - 6-digit Indian PIN code
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getLocationByPincode = async (pincode) => {
    const startTime = Date.now();

    // Validate PIN code format
    if (!isValidPincode(pincode)) {
        return {
            success: false,
            error: 'Invalid PIN code. Must be a 6-digit number starting with 1-9.'
        };
    }

    try {
        // Step 1: Check PostgreSQL cache
        const cached = await prisma.pincode.findUnique({
            where: { pincode }
        });

        const cacheTime = Date.now() - startTime;

        if (cached) {
            console.log(`[Location Service] Cache HIT for ${pincode} in ${cacheTime}ms`);
            return {
                success: true,
                data: {
                    pincode,
                    city: cached.city,
                    district: cached.district,
                    state: cached.state,
                    cached: true
                }
            };
        }

        console.log(`[Location Service] Cache MISS for ${pincode}, calling India Post API...`);

        // Step 2: Fetch from India Post API
        const apiData = await fetchFromIndiaPostAPI(pincode);

        if (!apiData) {
            return {
                success: false,
                error: 'Unable to find location for this PIN code. Please verify and try again.'
            };
        }

        // Step 3: Cache in PostgreSQL (upsert to handle race conditions)
        try {
            await prisma.pincode.upsert({
                where: { pincode },
                update: {}, // Do nothing if exists
                create: {
                    pincode,
                    city: apiData.city,
                    district: apiData.district,
                    state: apiData.state
                }
            });
            console.log(`[Location Service] Cached PIN ${pincode} in PostgreSQL`);
        } catch (cacheError) {
            // Log but don't fail - data was fetched successfully
            console.warn(`[Location Service] Failed to cache PIN ${pincode}:`, cacheError.message);
        }

        const totalTime = Date.now() - startTime;
        console.log(`[Location Service] Total response time for ${pincode}: ${totalTime}ms`);

        return {
            success: true,
            data: {
                pincode,
                city: apiData.city,
                district: apiData.district,
                state: apiData.state,
                cached: false
            }
        };

    } catch (error) {
        console.error('[Location Service] Error:', error.message);
        return {
            success: false,
            error: 'An error occurred while looking up the PIN code. Please try again.'
        };
    }
};

/**
 * Bulk lookup multiple PIN codes (for admin/data import)
 * @param {string[]} pincodes 
 * @returns {Promise<Map<string, object>>}
 */
export const bulkLookup = async (pincodes) => {
    const results = new Map();

    // Process in batches to avoid overwhelming external API
    const BATCH_SIZE = 5;
    const BATCH_DELAY = 1000; // 1 second between batches

    for (let i = 0; i < pincodes.length; i += BATCH_SIZE) {
        const batch = pincodes.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (pin) => {
            const result = await getLocationByPincode(pin);
            results.set(pin, result);
        }));

        // Delay between batches
        if (i + BATCH_SIZE < pincodes.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
    }

    return results;
};

export default {
    getLocationByPincode,
    bulkLookup,
    isValidPincode
};

