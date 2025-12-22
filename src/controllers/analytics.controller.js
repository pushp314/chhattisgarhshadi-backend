import analyticsService from '../services/analytics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
    const months = parseInt(req.query.months, 10) || 6;
    const data = await analyticsService.getRevenueAnalytics(months);
    res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, data, 'Revenue analytics retrieved successfully')
    );
});

/**
 * Get signups by category
 */
export const getSignupsByCategory = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const data = await analyticsService.getSignupsByCategory(limit);
    res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, data, 'Signup analytics retrieved successfully')
    );
});

/**
 * Get subscription analytics
 */
export const getSubscriptionAnalytics = asyncHandler(async (req, res) => {
    const data = await analyticsService.getSubscriptionAnalytics();
    res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, data, 'Subscription analytics retrieved successfully')
    );
});

export const analyticsController = {
    getRevenueAnalytics,
    getSignupsByCategory,
    getSubscriptionAnalytics,
};
