import cron from 'node-cron';
import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * FCM Token Cleanup Cron Job
 * Runs daily at 2 AM to cleanup stale and inactive FCM tokens
 */

/**
 * Cleanup old  and inactive FCM tokens
 */
const cleanupStaleTokens = async () => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Delete tokens that haven't been used in 30 days
        const staleTokensResult = await prisma.fcmToken.deleteMany({
            where: {
                lastUsedAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        // Delete inactive tokens
        const inactiveTokensResult = await prisma.fcmToken.deleteMany({
            where: {
                isActive: false,
                updatedAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        const totalCleaned = staleTokensResult.count + inactiveTokensResult.count;

        logger.info(
            `🧹 FCM Token Cleanup: Removed ${totalCleaned} tokens ` +
            `(${staleTokensResult.count} stale, ${inactiveTokensResult.count} inactive)`
        );

        return totalCleaned;
    } catch (error) {
        logger.error('❌ Error in FCM token cleanup:', error);
        return 0;
    }
};

/**
 * Initialize FCM token cleanup cron job
 * Runs every day at 2:00 AM
 */
export const initFcmTokenCleanup = () => {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        logger.info('⏰ Starting scheduled FCM token cleanup...');
        await cleanupStaleTokens();
    });

    logger.info('✅ FCM token cleanup cron job initialized (runs daily at 2 AM)');
};

/**
 * Manual cleanup function (for testing or admin trigger)
 */
export const runManualTokenCleanup = async () => {
    logger.info('🔧 Manual FCM token cleanup triggered');
    return await cleanupStaleTokens();
};

export default {
    initFcmTokenCleanup,
    runManualTokenCleanup,
};
