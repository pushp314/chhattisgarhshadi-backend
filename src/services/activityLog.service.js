import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../config/logger.js';

/**
 * Create an activity log entry
 */
export const createActivityLog = async ({
    actionType,
    description,
    actorId,
    actorEmail,
    targetType,
    targetId,
    targetEmail,
    metadata,
    ipAddress,
    userAgent,
}) => {
    try {
        const log = await prisma.activityLog.create({
            data: {
                actionType,
                description,
                actorId,
                actorEmail,
                targetType,
                targetId: targetId ? parseInt(targetId) : null,
                targetEmail,
                metadata: metadata || {},
                ipAddress,
                userAgent: userAgent?.substring(0, 500),
            },
        });
        return log;
    } catch (error) {
        logger.error('Error creating activity log:', error);
        // Don't throw - logging should not break the main flow
        return null;
    }
};

/**
 * Get activity logs with pagination and filtering
 */
export const getActivityLogs = async ({
    page = 1,
    limit = 20,
    actionType,
    actorId,
    startDate,
    endDate,
}) => {
    try {
        const skip = (page - 1) * limit;
        const where = {};

        if (actionType) {
            where.actionType = actionType;
        }

        if (actorId) {
            where.actorId = parseInt(actorId);
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    actor: {
                        select: {
                            id: true,
                            email: true,
                            profilePicture: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.activityLog.count({ where }),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        logger.error('Error fetching activity logs:', error);
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to fetch activity logs');
    }
};

/**
 * Get activity log stats
 */
export const getActivityStats = async () => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);

        const [totalLogs, todayLogs, weekLogs, actionBreakdown] = await Promise.all([
            prisma.activityLog.count(),
            prisma.activityLog.count({
                where: { createdAt: { gte: today } },
            }),
            prisma.activityLog.count({
                where: { createdAt: { gte: thisWeek } },
            }),
            prisma.activityLog.groupBy({
                by: ['actionType'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5,
            }),
        ]);

        return {
            totalLogs,
            todayLogs,
            weekLogs,
            topActions: actionBreakdown.map(a => ({
                action: a.actionType,
                count: a._count.id,
            })),
        };
    } catch (error) {
        logger.error('Error fetching activity stats:', error);
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to fetch activity stats');
    }
};

/**
 * Helper to log admin actions easily
 */
export const logAdminAction = async (req, actionType, description, target = {}) => {
    const actor = req.user;
    return createActivityLog({
        actionType,
        description,
        actorId: actor?.id,
        actorEmail: actor?.email,
        targetType: target.type,
        targetId: target.id,
        targetEmail: target.email,
        metadata: target.metadata,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers?.['user-agent'],
    });
};

export default {
    createActivityLog,
    getActivityLogs,
    getActivityStats,
    logAdminAction,
};
