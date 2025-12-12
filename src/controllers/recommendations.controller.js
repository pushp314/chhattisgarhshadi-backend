/**
 * Matching Algorithm Controller
 * Endpoints for match recommendations
 */

import {
    calculateMatchScore,
    getDailyRecommendations,
    getSuperMatches,
} from '../services/matchingAlgorithm.service.js';
import { logger } from '../config/logger.js';

/**
 * GET /api/v1/recommendations
 * Get daily match recommendations
 */
export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;

        const recommendations = await getDailyRecommendations(userId, limit);

        return res.status(200).json({
            success: true,
            data: recommendations,
            count: recommendations.length,
        });
    } catch (error) {
        logger.error('Error getting recommendations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get recommendations',
        });
    }
};

/**
 * GET /api/v1/recommendations/super-matches
 * Get super matches (85%+ compatibility)
 */
export const getSuperMatchesHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 5;

        const superMatches = await getSuperMatches(userId, limit);

        return res.status(200).json({
            success: true,
            data: superMatches,
            count: superMatches.length,
        });
    } catch (error) {
        logger.error('Error getting super matches:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get super matches',
        });
    }
};

/**
 * GET /api/v1/recommendations/score/:userId
 * Get match score with a specific user
 */
export const getMatchScore = async (req, res) => {
    try {
        const userId = req.user.id;
        const targetUserId = parseInt(req.params.userId);

        if (!targetUserId || isNaN(targetUserId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
        }

        const matchResult = await calculateMatchScore(userId, targetUserId);

        return res.status(200).json({
            success: true,
            data: matchResult,
        });
    } catch (error) {
        logger.error('Error getting match score:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get match score',
        });
    }
};

export default {
    getRecommendations,
    getSuperMatchesHandler,
    getMatchScore,
};
