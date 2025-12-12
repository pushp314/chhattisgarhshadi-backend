/**
 * Profile Boost Controller
 * API endpoints for boost/spotlight/highlighter features
 */

import {
    activateBoost,
    getActiveBoost,
    getBoostPackages,
    getBoostedProfileIds,
} from '../services/profileBoost.service.js';
import { logger } from '../config/logger.js';

/**
 * GET /api/v1/boost/packages
 * Get all available boost packages
 */
export const getPackages = async (req, res) => {
    try {
        const packages = getBoostPackages();

        return res.status(200).json({
            success: true,
            data: packages,
        });
    } catch (error) {
        logger.error('Error getting boost packages:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get boost packages',
        });
    }
};

/**
 * GET /api/v1/boost/active
 * Get user's active boost status
 */
export const getActive = async (req, res) => {
    try {
        const userId = req.user.id;
        const activeBoost = await getActiveBoost(userId);

        return res.status(200).json({
            success: true,
            data: activeBoost,
            hasActiveBoost: !!activeBoost,
        });
    } catch (error) {
        logger.error('Error getting active boost:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get active boost',
        });
    }
};

/**
 * POST /api/v1/boost/activate
 * Activate a boost package
 * Body: { boostType: string, transactionId: string }
 */
export const activate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { boostType, transactionId } = req.body;

        if (!boostType || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'boostType and transactionId are required',
            });
        }

        const result = await activateBoost(userId, boostType, transactionId);

        return res.status(200).json({
            success: true,
            message: 'Boost activated successfully',
            data: result,
        });
    } catch (error) {
        logger.error('Error activating boost:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to activate boost',
        });
    }
};

/**
 * GET /api/v1/boost/featured
 * Get currently boosted profiles (for discovery page)
 */
export const getFeaturedProfiles = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const boostedProfiles = await getBoostedProfileIds(limit);

        return res.status(200).json({
            success: true,
            data: boostedProfiles,
        });
    } catch (error) {
        logger.error('Error getting featured profiles:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get featured profiles',
        });
    }
};

export default {
    getPackages,
    getActive,
    activate,
    getFeaturedProfiles,
};
