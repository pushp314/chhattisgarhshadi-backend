import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { shortlistService } from '../services/shortlist.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Add a user to the current user's shortlist
 */
export const addToShortlist = asyncHandler(async (req, res) => {
  const { shortlistedUserId, note } = req.body;
  const shortlistEntry = await shortlistService.addToShortlist(
    req.user.id,
    shortlistedUserId,
    note
  );
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        shortlistEntry,
        'User added to shortlist'
      )
    );
});

/**
 * Get the current user's complete shortlist
 */
export const getMyShortlist = asyncHandler(async (req, res) => {
  const result = await shortlistService.getMyShortlist(req.user.id, req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Shortlist retrieved successfully')
    );
});

/**
 * Remove a user from the current user's shortlist
 */
export const removeFromShortlist = asyncHandler(async (req, res) => {
  const { shortlistedUserId } = req.params;
  await shortlistService.removeFromShortlist(req.user.id, shortlistedUserId);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, null, 'User removed from shortlist')
    );
});

export const shortlistController = {
  addToShortlist,
  getMyShortlist,
  removeFromShortlist,
};