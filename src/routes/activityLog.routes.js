import express from 'express';
import { getActivityLogs, getActivityStats } from '../controllers/activityLog.controller.js';

const router = express.Router();

// All routes require admin authentication (applied in parent router)

/**
 * @route   GET /admin/activity-logs
 * @desc    Get activity logs with pagination and filters
 * @access  Admin
 */
router.get('/', getActivityLogs);

/**
 * @route   GET /admin/activity-logs/stats
 * @desc    Get activity log statistics
 * @access  Admin
 */
router.get('/stats', getActivityStats);

export default router;
