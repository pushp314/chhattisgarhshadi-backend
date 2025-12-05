import { asyncHandler } from '../utils/asyncHandler.js';
import activityLogService from '../services/activityLog.service.js';

/**
 * Get activity logs with pagination and filters
 */
export const getActivityLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, actionType, actorId, startDate, endDate } = req.query;

    const result = await activityLogService.getActivityLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        actionType,
        actorId,
        startDate,
        endDate,
    });

    res.json({
        success: true,
        ...result,
    });
});

/**
 * Get activity log stats
 */
export const getActivityStats = asyncHandler(async (req, res) => {
    const stats = await activityLogService.getActivityStats();

    res.json({
        success: true,
        data: stats,
    });
});

export default {
    getActivityLogs,
    getActivityStats,
};
