/**
 * Audit Log Service
 * Tracks all critical database changes for compliance, debugging, and analytics
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Log a database change to the audit log
 * @param {Object} params - Audit log parameters
 * @param {string} params.tableName - Name of the table being changed
 * @param {number} params.recordId - ID of the record being changed
 * @param {string} params.action - INSERT, UPDATE, or DELETE
 * @param {Object} params.oldValues - Previous values (for UPDATE/DELETE)
 * @param {Object} params.newValues - New values (for INSERT/UPDATE)
 * @param {number} params.changedBy - User ID who made the change
 * @param {string} params.changedByType - USER, ADMIN, or SYSTEM
 * @param {Object} params.requestContext - IP, user agent, request ID
 */
export const logChange = async ({
    tableName,
    recordId,
    action,
    oldValues = null,
    newValues = null,
    changedBy = null,
    changedByType = 'USER',
    requestContext = {},
}) => {
    try {
        // Calculate changed fields for UPDATE actions
        let changedFields = null;
        if (action === 'UPDATE' && oldValues && newValues) {
            const changed = [];
            for (const key of Object.keys(newValues)) {
                if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
                    changed.push(key);
                }
            }
            changedFields = changed.join(', ');
        }

        await prisma.auditLog.create({
            data: {
                tableName,
                recordId,
                action,
                oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
                newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
                changedFields,
                changedBy,
                changedByType,
                ipAddress: requestContext.ipAddress || null,
                userAgent: requestContext.userAgent || null,
                requestId: requestContext.requestId || null,
            },
        });

        logger.debug(`Audit: ${action} on ${tableName}:${recordId} by ${changedByType}:${changedBy}`);
    } catch (error) {
        // Don't fail the main operation if audit logging fails
        logger.error('Audit logging failed:', error);
    }
};

/**
 * Log a search for analytics
 * @param {Object} params - Search log parameters
 */
export const logSearch = async ({
    userId = null,
    searchFilters,
    resultCount,
    executionTimeMs,
    searchType = 'PROFILE',
    platform = 'MOBILE',
}) => {
    try {
        await prisma.searchLog.create({
            data: {
                userId,
                searchFilters,
                resultCount,
                executionTimeMs,
                searchType,
                platform,
            },
        });
    } catch (error) {
        logger.error('Search logging failed:', error);
    }
};

/**
 * Log database metrics for monitoring
 * @param {Object} params - Metric parameters
 */
export const logMetric = async ({
    metricName,
    metricValue,
    metricUnit,
    tableName = null,
    queryType = null,
    metadata = null,
}) => {
    try {
        await prisma.databaseMetrics.create({
            data: {
                metricName,
                metricValue,
                metricUnit,
                tableName,
                queryType,
                metadata,
            },
        });
    } catch (error) {
        logger.error('Metric logging failed:', error);
    }
};

/**
 * Log rate limit hits for security monitoring
 * @param {Object} params - Rate limit parameters
 */
export const logRateLimitHit = async ({
    userId = null,
    ipAddress,
    endpoint,
    method,
    windowStart,
    windowEnd,
}) => {
    try {
        await prisma.apiRateLimitLog.create({
            data: {
                userId,
                ipAddress,
                endpoint,
                method,
                windowStart,
                windowEnd,
            },
        });
    } catch (error) {
        logger.error('Rate limit logging failed:', error);
    }
};

/**
 * Get recent audit logs for a record
 * @param {string} tableName - Table name
 * @param {number} recordId - Record ID
 * @param {number} limit - Max records to return
 */
export const getAuditHistory = async (tableName, recordId, limit = 50) => {
    return prisma.auditLog.findMany({
        where: { tableName, recordId },
        orderBy: { changedAt: 'desc' },
        take: limit,
    });
};

/**
 * Get slow searches for optimization
 * @param {number} thresholdMs - Minimum execution time
 * @param {number} limit - Max records to return
 */
export const getSlowSearches = async (thresholdMs = 1000, limit = 100) => {
    return prisma.searchLog.findMany({
        where: {
            executionTimeMs: { gte: thresholdMs },
        },
        orderBy: { executionTimeMs: 'desc' },
        take: limit,
    });
};

/**
 * Cleanup old audit logs (retention policy)
 * @param {number} daysToKeep - Days of logs to retain
 */
export const cleanupOldLogs = async (daysToKeep = 90) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const [auditDeleted, searchDeleted, metricsDeleted, rateLimitDeleted] = await Promise.all([
        prisma.auditLog.deleteMany({
            where: { changedAt: { lt: cutoffDate } },
        }),
        prisma.searchLog.deleteMany({
            where: { searchedAt: { lt: cutoffDate } },
        }),
        prisma.databaseMetrics.deleteMany({
            where: { recordedAt: { lt: cutoffDate } },
        }),
        prisma.apiRateLimitLog.deleteMany({
            where: { createdAt: { lt: cutoffDate } },
        }),
    ]);

    logger.info(`Audit cleanup: Deleted ${auditDeleted.count} audit logs, ${searchDeleted.count} search logs, ${metricsDeleted.count} metrics, ${rateLimitDeleted.count} rate limit logs`);

    return {
        auditDeleted: auditDeleted.count,
        searchDeleted: searchDeleted.count,
        metricsDeleted: metricsDeleted.count,
        rateLimitDeleted: rateLimitDeleted.count,
    };
};

export default {
    logChange,
    logSearch,
    logMetric,
    logRateLimitHit,
    getAuditHistory,
    getSlowSearches,
    cleanupOldLogs,
};
