import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { blockService } from '../services/block.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Block a user
 */
export const blockUser = asyncHandler(async (req, res) => {
  const { blockedId, reason } = req.body;
  const blockEntry = await blockService.blockUser(
    req.user.id,
    blockedId,
    reason
  );
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        blockEntry,
        'User blocked successfully'
      )
    );
});

/**
 * Get the current user's block list
 */
export const getMyBlockedList = asyncHandler(async (req, res) => {
  const result = await blockService.getMyBlockedList(req.user.id, req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Blocked list retrieved successfully')
    );
});

/**
 * Unblock a user
 */
export const unblockUser = asyncHandler(async (req, res) => {
  const { blockedId } = req.params;
  await blockService.unblockUser(req.user.id, blockedId);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, null, 'User unblocked successfully')
    );
});

export const blockController = {
  blockUser,
  getMyBlockedList,
  unblockUser,
};