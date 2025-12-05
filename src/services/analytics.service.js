import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../config/logger.js';

/**
 * Get monthly revenue data for the last N months
 */
export const getRevenueAnalytics = async (months = 6) => {
    try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        // Get payments grouped by month
        const payments = await prisma.payment.findMany({
            where: {
                status: 'COMPLETED',
                paidAt: {
                    gte: startDate,
                },
            },
            select: {
                amount: true,
                paidAt: true,
            },
        });

        // Group by month
        const monthlyRevenue = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize all months with 0
        for (let i = 0; i < months; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - (months - 1 - i));
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            monthlyRevenue[key] = {
                month: monthNames[date.getMonth()],
                year: date.getFullYear(),
                revenue: 0,
            };
        }

        // Sum up payments
        payments.forEach((payment) => {
            if (payment.paidAt) {
                const key = `${payment.paidAt.getFullYear()}-${payment.paidAt.getMonth()}`;
                if (monthlyRevenue[key]) {
                    monthlyRevenue[key].revenue += parseFloat(payment.amount);
                }
            }
        });

        // Calculate total and growth
        const result = Object.values(monthlyRevenue);
        const totalRevenue = result.reduce((sum, m) => sum + m.revenue, 0);

        // Calculate growth (compare last month to previous month)
        const lastMonth = result[result.length - 1]?.revenue || 0;
        const prevMonth = result[result.length - 2]?.revenue || 0;
        const growth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

        return {
            data: result,
            totalRevenue,
            growth: Math.round(growth * 10) / 10,
        };
    } catch (error) {
        logger.error('Error in getRevenueAnalytics:', error);
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get revenue analytics');
    }
};

/**
 * Get user signups by district
 */
export const getSignupsByDistrict = async (limit = 10) => {
    try {
        // Get signups grouped by district from profiles
        const signups = await prisma.profile.groupBy({
            by: ['nativeDistrict'],
            _count: {
                id: true,
            },
            where: {
                nativeDistrict: {
                    not: null,
                },
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: limit,
        });

        // Get total users in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsersCount = await prisma.user.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
        });

        // Calculate growth (compare to previous 30 days)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const prevPeriodCount = await prisma.user.count({
            where: {
                createdAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo,
                },
            },
        });

        const growth = prevPeriodCount > 0 ? ((newUsersCount - prevPeriodCount) / prevPeriodCount) * 100 : 0;

        return {
            data: signups.map((s) => ({
                district: s.nativeDistrict || 'Unknown',
                users: s._count.id,
            })),
            newUsers30d: newUsersCount,
            growth: Math.round(growth * 10) / 10,
        };
    } catch (error) {
        logger.error('Error in getSignupsByDistrict:', error);
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get signup analytics');
    }
};

/**
 * Get subscription breakdown
 */
export const getSubscriptionAnalytics = async () => {
    try {
        // Get active subscriptions count
        const activeSubscriptions = await prisma.userSubscription.count({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: new Date(),
                },
            },
        });

        // Get subscriptions by plan
        const subscriptionsByPlan = await prisma.userSubscription.groupBy({
            by: ['planId'],
            _count: {
                id: true,
            },
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: new Date(),
                },
            },
        });

        // Get plan names
        const plans = await prisma.subscriptionPlan.findMany({
            select: {
                id: true,
                name: true,
            },
        });

        const planMap = {};
        plans.forEach((p) => {
            planMap[p.id] = p.name;
        });

        // Find most popular plan
        let mostPopular = null;
        let maxCount = 0;
        subscriptionsByPlan.forEach((s) => {
            if (s._count.id > maxCount) {
                maxCount = s._count.id;
                mostPopular = planMap[s.planId] || 'Unknown';
            }
        });

        return {
            activeSubscriptions,
            mostPopularPlan: mostPopular || 'None',
            breakdown: subscriptionsByPlan.map((s) => ({
                plan: planMap[s.planId] || 'Unknown',
                count: s._count.id,
            })),
        };
    } catch (error) {
        logger.error('Error in getSubscriptionAnalytics:', error);
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get subscription analytics');
    }
};

export default {
    getRevenueAnalytics,
    getSignupsByDistrict,
    getSubscriptionAnalytics,
};
