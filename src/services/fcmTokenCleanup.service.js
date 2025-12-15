import cron from 'node-cron';
import { notificationService } from './notification.service.js';
import { logger } from '../config/logger.js';

/**
 * Initialize FCM Token Cleanup Cron Job
 * Schedule: Daily at 2:00 AM
 */
export const initFcmTokenCleanup = () => {
    logger.info('Initializing FCM Token Cleanup Job (Daily at 2:00 AM)');

    // Schedule task to run at 2:00 AM every day
    // Cron syntax: minute hour day-of-month month day-of-week
    cron.schedule('0 2 * * *', async () => {
        logger.info('⏰ Running scheduled FCM token cleanup...');
        try {
            const removedCount = await notificationService.cleanupStaleTokens();
            logger.info(`✅ Scheduled FCM cleanup complete. Removed ${removedCount} stale tokens.`);
        } catch (error) {
            logger.error('❌ Scheduled FCM cleanup failed:', error);
        }
    });
};
