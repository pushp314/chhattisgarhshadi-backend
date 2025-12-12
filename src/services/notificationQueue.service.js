/**
 * BullMQ Queue Structure for High-Volume Notifications
 * Optional: Only use this if handling 10,000+ notifications per minute
 * 
 * Installation Required:
 * npm install bullmq ioredis
 */

import { Queue, Worker } from 'bullmq';
import { createNotification } from './notification.service.js';
import { logger } from '../config/logger.js';

// Redis connection config (use environment variables in production)
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
};

// Create notification queue
const notificationQueue = new Queue('fcm-notifications', {
    connection,
    defaultJobOptions: {
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2s delay
        },
        removeOnComplete: {
            age: 24 * 60 * 60, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
            age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
        },
    },
});

// Create worker to process notification jobs
const notificationWorker = new Worker(
    'fcm-notifications',
    async (job) => {
        logger.info(`📋 Processing notification job ${job.id}:`, job.data);

        try {
            // Call the main notification service
            const result = await createNotification(job.data);

            logger.info(`✅ Notification job ${job.id} completed successfully`);
            return result;
        } catch (error) {
            logger.error(`❌ Notification job ${job.id} failed:`, error);
            throw error; // Will trigger retry
        }
    },
    {
        connection,
        concurrency: 10, // Process 10 jobs concurrently
        limiter: {
            max: 100, // Max 100 jobs
            duration: 1000, // per second
        },
    }
);

// Event listeners for monitoring
notificationWorker.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed with error:`, err);
});

notificationWorker.on('error', (err) => {
    logger.error('Worker error:', err);
});

/**
 * Add a notification to the queue
 * @param {object} notificationData - Notification DTO
 * @param {object} [options] - Queue options (priority, delay, etc.)
 * @returns {Promise<Job>}
 */
export const queueNotification = async (notificationData, options = {}) => {
    try {
        const job = await notificationQueue.add(
            'send-notification',
            notificationData,
            {
                priority: options.priority || 1, // Lower number = higher priority
                delay: options.delay || 0, // Delay in ms
                ...options,
            }
        );

        logger.info(`📤 Notification job queued: ${job.id}`);
        return job;
    } catch (error) {
        logger.error('Failed to queue notification:', error);
        throw error;
    }
};

/**
 * Batch queue multiple notifications
 * @param {Array} notifications - Array of notification DTOs
 * @returns {Promise<Array<Job>>}
 */
export const queueBulkNotifications = async (notifications) => {
    try {
        const jobs = notifications.map((notification, index) => ({
            name: `bulk-notification-${index}`,
            data: notification,
            opts: {
                priority: notification.priority || 5,
            },
        }));

        const addedJobs = await notificationQueue.addBulk(jobs);

        logger.info(`📤 Bulk queued ${addedJobs.length} notifications`);
        return addedJobs;
    } catch (error) {
        logger.error('Failed to queue bulk notifications:', error);
        throw error;
    }
};

/**
 * Get queue statistics
 * @returns {Promise<object>}
 */
export const getQueueStats = async () => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        notificationQueue.getWaitingCount(),
        notificationQueue.getActiveCount(),
        notificationQueue.getCompletedCount(),
        notificationQueue.getFailedCount(),
        notificationQueue.getDelayedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
    };
};

/**
 * Pause the queue (for maintenance)
 */
export const pauseQueue = async () => {
    await notificationQueue.pause();
    logger.warn('⏸️  Notification queue paused');
};

/**
 * Resume the queue
 */
export const resumeQueue = async () => {
    await notificationQueue.resume();
    logger.info('▶️  Notification queue resumed');
};

/**
 * Clean up old jobs
 */
export const cleanupQueue = async () => {
    await notificationQueue.clean(24 * 60 * 60 * 1000, 1000, 'completed'); // 24 hours
    await notificationQueue.clean(7 * 24 * 60 * 60 * 1000, 100, 'failed'); // 7 days
    logger.info('🧹 Queue cleanup completed');
};

/**
 * Graceful shutdown
 */
export const shutdownQueue = async () => {
    logger.info('Shutting down notification queue...');
    await notificationWorker.close();
    await notificationQueue.close();
    logger.info('Notification queue shut down successfully');
};

// Export queue instance for advanced usage
export { notificationQueue, not ificationWorker };

export default {
    queueNotification,
    queueBulkNotifications,
    getQueueStats,
    pauseQueue,
    resumeQueue,
    cleanupQueue,
    shutdownQueue,
};
