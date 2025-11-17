import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { subscriptionService } from '../services/subscription.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get all active subscription plans
 */
export const getActivePlans = asyncHandler(async (req, res) => {
  const result = await subscriptionService.getActivePlans(req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        result,
        'Subscription plans retrieved successfully'
      )
    );
});

export const subscriptionController = {
  getActivePlans,
};