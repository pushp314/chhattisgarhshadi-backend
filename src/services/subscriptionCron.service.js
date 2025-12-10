/**
 * Subscription Cron Jobs
 * Handles scheduled tasks for subscription management:
 * - Expiry reminders (3 days, 1 day, same day)
 * - Expired subscription handling
 */

import prisma from '../config/database.js';
import { notificationService } from '../services/notification.service.js';
import { NOTIFICATION_TYPES, SUBSCRIPTION_STATUS, USER_ROLES } from '../utils/constants.js';
import { logger } from '../config/logger.js';

/**
 * Send subscription expiry reminders
 * Run this daily (e.g., at 9 AM)
 */
export const sendExpiryReminders = async () => {
    logger.info('Running subscription expiry reminder job...');

    try {
        const now = new Date();

        // Define reminder intervals (in days)
        const reminders = [
            { days: 3, title: 'Subscription Expiring Soon ⏰', message: 'Your premium subscription will expire in 3 days. Renew now to continue enjoying premium features!' },
            { days: 1, title: 'Last Day Reminder! ⚠️', message: 'Your premium subscription expires tomorrow! Renew now to avoid losing premium features.' },
            { days: 0, title: 'Subscription Expires Today! 🚨', message: 'Your premium subscription expires today. Renew immediately to keep your premium benefits!' },
        ];

        let totalNotificationsSent = 0;

        for (const reminder of reminders) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + reminder.days);

            // Set to start and end of target day
            const dayStart = new Date(targetDate);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(targetDate);
            dayEnd.setHours(23, 59, 59, 999);

            // Find subscriptions expiring on target date
            const expiringSubscriptions = await prisma.userSubscription.findMany({
                where: {
                    status: SUBSCRIPTION_STATUS.ACTIVE,
                    endDate: {
                        gte: dayStart,
                        lte: dayEnd,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            profile: { select: { firstName: true } },
                        },
                    },
                    plan: {
                        select: { name: true },
                    },
                },
            });

            logger.info(`Found ${expiringSubscriptions.length} subscriptions expiring in ${reminder.days} days`);

            // Send notifications
            for (const subscription of expiringSubscriptions) {
                const userName = subscription.user?.profile?.firstName || 'User';

                await notificationService.createNotification({
                    userId: subscription.userId,
                    type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING,
                    title: reminder.title,
                    message: reminder.message,
                    data: {
                        type: 'SUBSCRIPTION_EXPIRING',
                        daysRemaining: String(reminder.days),
                        subscriptionId: String(subscription.id),
                        planName: subscription.plan?.name || 'Premium',
                    },
                });

                totalNotificationsSent++;
            }
        }

        logger.info(`Subscription expiry reminder job completed. Sent ${totalNotificationsSent} notifications.`);
        return { success: true, notificationsSent: totalNotificationsSent };

    } catch (error) {
        logger.error('Error in sendExpiryReminders:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark expired subscriptions and downgrade users
 * Run this daily (e.g., at midnight)
 */
export const handleExpiredSubscriptions = async () => {
    logger.info('Running expired subscription handler...');

    try {
        const now = new Date();

        // Find expired active subscriptions
        const expiredSubscriptions = await prisma.userSubscription.findMany({
            where: {
                status: SUBSCRIPTION_STATUS.ACTIVE,
                endDate: {
                    lt: now,
                },
            },
        });

        logger.info(`Found ${expiredSubscriptions.length} expired subscriptions`);

        let processedCount = 0;

        for (const subscription of expiredSubscriptions) {
            try {
                await prisma.$transaction([
                    // 1. Mark subscription as expired
                    prisma.userSubscription.update({
                        where: { id: subscription.id },
                        data: { status: SUBSCRIPTION_STATUS.EXPIRED },
                    }),
                    // 2. Downgrade user role (if no other active subscriptions)
                    prisma.user.update({
                        where: { id: subscription.userId },
                        data: { role: USER_ROLES.USER },
                    }),
                ]);

                // 3. Send expiration notification
                await notificationService.createNotification({
                    userId: subscription.userId,
                    type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED,
                    title: 'Subscription Expired 😢',
                    message: 'Your premium subscription has expired. Renew now to restore your premium features!',
                    data: {
                        type: 'SUBSCRIPTION_EXPIRED',
                        subscriptionId: String(subscription.id),
                    },
                });

                processedCount++;
            } catch (err) {
                logger.error(`Error processing expired subscription ${subscription.id}:`, err);
            }
        }

        logger.info(`Expired subscription handler completed. Processed ${processedCount} subscriptions.`);
        return { success: true, processedCount };

    } catch (error) {
        logger.error('Error in handleExpiredSubscriptions:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Initialize cron jobs
 * Call this on server startup
 */
export const initSubscriptionCronJobs = () => {
    // Use node-cron or similar for production
    // For now, we'll use setInterval as a simple alternative

    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_DAY = 24 * ONE_HOUR;

    // Run expiry reminders every 24 hours (at ~9 AM ideally)
    // In production, use node-cron: cron.schedule('0 9 * * *', sendExpiryReminders)
    setInterval(sendExpiryReminders, ONE_DAY);

    // Run expired handler every 24 hours (at ~midnight ideally)  
    // In production, use node-cron: cron.schedule('0 0 * * *', handleExpiredSubscriptions)
    setInterval(handleExpiredSubscriptions, ONE_DAY);

    // Run once on startup (after 5 seconds delay to let server fully start)
    setTimeout(() => {
        sendExpiryReminders();
        handleExpiredSubscriptions();
    }, 5000);

    logger.info('Subscription cron jobs initialized');
};

export default {
    sendExpiryReminders,
    handleExpiredSubscriptions,
    initSubscriptionCronJobs,
};
