import { Router } from 'express';
import prisma from '../config/database.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * GET /admin/audit-logs
 * Fetch paginated audit logs with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { page, limit, skip } = getPaginationParams(req.query);
        const { tableName, action, changedByType, startDate, endDate } = req.query;

        // Build filter conditions
        const where = {};
        if (tableName) where.tableName = tableName;
        if (action) where.action = action;
        if (changedByType) where.changedByType = changedByType;
        if (startDate || endDate) {
            where.changedAt = {};
            if (startDate) where.changedAt.gte = new Date(startDate);
            if (endDate) where.changedAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { changedAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);

        const pagination = getPaginationMetadata(page, limit, total);

        res.json({
            success: true,
            data: { logs, pagination },
        });
    } catch (error) {
        logger.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
        });
    }
});

/**
 * GET /admin/audit-logs/stats
 * Get audit log statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [total, inserts, updates, deletes] = await Promise.all([
            prisma.auditLog.count(),
            prisma.auditLog.count({ where: { action: 'INSERT' } }),
            prisma.auditLog.count({ where: { action: 'UPDATE' } }),
            prisma.auditLog.count({ where: { action: 'DELETE' } }),
        ]);

        // Get most active tables
        const tableStats = await prisma.auditLog.groupBy({
            by: ['tableName'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        res.json({
            success: true,
            data: {
                total,
                inserts,
                updates,
                deletes,
                tableStats: tableStats.map(t => ({
                    table: t.tableName,
                    count: t._count.id,
                })),
            },
        });
    } catch (error) {
        logger.error('Error fetching audit stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit statistics',
        });
    }
});

/**
 * GET /admin/audit-logs/:recordId
 * Get audit history for a specific record
 */
router.get('/record/:tableName/:recordId', async (req, res) => {
    try {
        const { tableName, recordId } = req.params;
        const { page, limit, skip } = getPaginationParams(req.query);

        const where = {
            tableName,
            recordId: parseInt(recordId, 10),
        };

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { changedAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);

        const pagination = getPaginationMetadata(page, limit, total);

        res.json({
            success: true,
            data: { logs, pagination },
        });
    } catch (error) {
        logger.error('Error fetching record audit history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch record audit history',
        });
    }
});

export default router;
