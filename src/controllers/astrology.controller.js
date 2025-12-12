/**
 * Astrology Controller
 * API endpoints for astrology/kundli matching
 */

import {
    getCompatibility,
    getNakshatras,
    getRashis,
} from '../services/astrology.service.js';
import { logger } from '../config/logger.js';

/**
 * GET /api/v1/astrology/nakshatras
 * Get list of all nakshatras for selection
 */
export const getNakshatraList = async (req, res) => {
    try {
        const nakshatras = getNakshatras();

        return res.status(200).json({
            success: true,
            data: nakshatras.map((name, index) => ({ id: index, name })),
        });
    } catch (error) {
        logger.error('Error getting nakshatras:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get nakshatras',
        });
    }
};

/**
 * GET /api/v1/astrology/rashis
 * Get list of all rashis for selection
 */
export const getRashiList = async (req, res) => {
    try {
        const rashis = getRashis();

        return res.status(200).json({
            success: true,
            data: rashis.map((name, index) => ({ id: index, name })),
        });
    } catch (error) {
        logger.error('Error getting rashis:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get rashis',
        });
    }
};

/**
 * GET /api/v1/astrology/match/:targetUserId
 * Get astrology compatibility between current user and target user
 */
export const getMatch = async (req, res) => {
    try {
        const userId = req.user.id;
        const targetUserId = parseInt(req.params.targetUserId);

        if (!targetUserId || isNaN(targetUserId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target user ID',
            });
        }

        const compatibility = await getCompatibility(userId, targetUserId);

        return res.status(200).json({
            success: true,
            data: compatibility,
        });
    } catch (error) {
        logger.error('Error getting astrology match:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get astrology match',
        });
    }
};

export default {
    getNakshatraList,
    getRashiList,
    getMatch,
};
