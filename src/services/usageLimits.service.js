/**
 * Usage Limits Service
 * Tracks daily usage for free and premium users
 * - Free users: 5 requests + 5 profile views per day
 * - ₹299 plan: 20 requests per day
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

// Daily limits by plan type
const USAGE_LIMITS = {
    FREE: {
        profileViews: 5,
        contactRequests: 5,
        interestsSent: 5,
        messagesPerDay: 10,
    },
    BASIC_299: {
        profileViews: 50,
        contactRequests: 20,
        interestsSent: 20,
        messagesPerDay: 100,
    },
    PREMIUM: {
        profileViews: -1, // Unlimited
        contactRequests: -1,
        interestsSent: -1,
        messagesPerDay: -1,
    },
};

/**
 * Get today's date key for tracking (resets at midnight IST)
 */
const getTodayKey = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Get or create daily usage record for user
 * @param {number} userId - User ID
 */
export const getDailyUsage = async (userId) => {
    const dateKey = getTodayKey();

    let usage = await prisma.dailyUsage.findUnique({
        where: {
            userId_date: {
                userId,
                date: dateKey,
            },
        },
    });

    if (!usage) {
        usage = await prisma.dailyUsage.create({
            data: {
                userId,
                date: dateKey,
                profileViews: 0,
                contactRequests: 0,
                interestsSent: 0,
                messagesCount: 0,
            },
        });
    }

    return usage;
};

/**
 * Get user's plan type
 * @param {number} userId - User ID
 */
export const getUserPlanType = async (userId) => {
    const subscription = await prisma.userSubscription.findFirst({
        where: {
            userId,
            status: 'ACTIVE',
            endDate: { gte: new Date() },
        },
        include: { plan: true },
        orderBy: { endDate: 'desc' },
    });

    if (!subscription) return 'FREE';

    const planName = subscription.plan?.name?.toUpperCase() || '';
    if (planName.includes('PREMIUM') || planName.includes('GOLD')) return 'PREMIUM';
    if (planName.includes('299') || planName.includes('BASIC')) return 'BASIC_299';

    return 'FREE';
};

/**
 * Get limits for user's plan
 * @param {number} userId - User ID
 */
export const getUserLimits = async (userId) => {
    const planType = await getUserPlanType(userId);
    return {
        planType,
        limits: USAGE_LIMITS[planType] || USAGE_LIMITS.FREE,
    };
};

/**
 * Check if user can perform action
 * @param {number} userId - User ID
 * @param {string} actionType - 'profileViews' | 'contactRequests' | 'interestsSent' | 'messagesCount'
 */
export const canPerformAction = async (userId, actionType) => {
    const { planType, limits } = await getUserLimits(userId);

    // Premium users have no limits (-1)
    if (limits[actionType] === -1) {
        return { allowed: true, remaining: -1, planType };
    }

    const usage = await getDailyUsage(userId);
    const currentCount = usage[actionType] || 0;
    const limit = limits[actionType] || 0;
    const remaining = Math.max(0, limit - currentCount);

    return {
        allowed: currentCount < limit,
        remaining,
        used: currentCount,
        limit,
        planType,
    };
};

/**
 * Increment usage counter
 * @param {number} userId - User ID
 * @param {string} actionType - Action type
 */
export const incrementUsage = async (userId, actionType) => {
    const dateKey = getTodayKey();

    await prisma.dailyUsage.upsert({
        where: {
            userId_date: {
                userId,
                date: dateKey,
            },
        },
        update: {
            [actionType]: { increment: 1 },
        },
        create: {
            userId,
            date: dateKey,
            profileViews: actionType === 'profileViews' ? 1 : 0,
            contactRequests: actionType === 'contactRequests' ? 1 : 0,
            interestsSent: actionType === 'interestsSent' ? 1 : 0,
            messagesCount: actionType === 'messagesCount' ? 1 : 0,
        },
    });

    logger.debug(`Usage incremented: ${actionType} for user ${userId}`);
};

/**
 * Get usage summary for user
 * @param {number} userId - User ID
 */
export const getUsageSummary = async (userId) => {
    const { planType, limits } = await getUserLimits(userId);
    const usage = await getDailyUsage(userId);

    return {
        planType,
        date: getTodayKey(),
        usage: {
            profileViews: {
                used: usage.profileViews,
                limit: limits.profileViews,
                remaining: limits.profileViews === -1 ? -1 : Math.max(0, limits.profileViews - usage.profileViews),
            },
            contactRequests: {
                used: usage.contactRequests,
                limit: limits.contactRequests,
                remaining: limits.contactRequests === -1 ? -1 : Math.max(0, limits.contactRequests - usage.contactRequests),
            },
            interestsSent: {
                used: usage.interestsSent,
                limit: limits.interestsSent,
                remaining: limits.interestsSent === -1 ? -1 : Math.max(0, limits.interestsSent - usage.interestsSent),
            },
        },
    };
};

/**
 * Cleanup old usage records (run daily via cron)
 * Keep last 30 days of data
 */
export const cleanupOldUsageRecords = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    const result = await prisma.dailyUsage.deleteMany({
        where: { date: { lt: cutoffDate } },
    });

    logger.info(`Cleaned up ${result.count} old usage records`);
    return result.count;
};

export default {
    getDailyUsage,
    getUserPlanType,
    getUserLimits,
    canPerformAction,
    incrementUsage,
    getUsageSummary,
    cleanupOldUsageRecords,
    USAGE_LIMITS,
};
