import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * Get all active subscription plans (paginated)
 * @param {Object} query - Pagination query
 * @returns {Promise<Object>} Paginated list of plans
 */
export const getActivePlans = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const where = { isActive: true };

  try {
    const [plans, total] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          displayOrder: 'asc', // Order by displayOrder
        },
      }),
      prisma.subscriptionPlan.count({ where }),
    ]);

    // Parse the 'features' string into an array
    const parsedPlans = plans.map(plan => {
      let featuresArray = [];
      if (plan.features) {
        try {
          // Attempt to parse the JSON string
          featuresArray = JSON.parse(plan.features);
        } catch (e) {
          logger.warn(`Failed to parse features JSON for planId ${plan.id}`);
          // Fallback to an empty array if parsing fails
          featuresArray = [];
        }
      }
      return { ...plan, features: featuresArray };
    });

    const pagination = getPaginationMetadata(page, limit, total);

    return { plans: parsedPlans, pagination };
  } catch (error) {
    logger.error('Error in getActivePlans:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving subscription plans');
  }
};

export const subscriptionService = {
  getActivePlans,
};