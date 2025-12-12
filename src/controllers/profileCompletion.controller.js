/**
 * Profile Completion Controller
 * API endpoints for profile completion tracking
 */

import { getProfileCompletionForUser, getCompletionBadge } from '../services/profileCompletion.service.js';
import { logger } from '../config/logger.js';

/**
 * GET /api/v1/profile/completion
 * Get profile completion percentage and tips
 */
export const getProfileCompletion = async (req, res) => {
    try {
        const userId = req.user.id;

        const completion = await getProfileCompletionForUser(userId);
        const badge = getCompletionBadge(completion.percentage);

        return res.status(200).json({
            success: true,
            data: {
                ...completion,
                badge,
            },
        });
    } catch (error) {
        logger.error('Error getting profile completion:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get profile completion',
        });
    }
};

export default {
    getProfileCompletion,
};
