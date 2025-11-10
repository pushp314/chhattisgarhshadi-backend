import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { matchService } from '../services/match.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants.js';

/**
 * Send match request
 */
export const sendMatchRequest = asyncHandler(async (req, res) => {
  const { toUserId } = req.body;

  const match = await matchService.sendMatchRequest(req.user.id, toUserId);

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, match, SUCCESS_MESSAGES.MATCH_SENT)
  );
});

/**
 * Accept match request
 */
export const acceptMatchRequest = asyncHandler(async (req, res) => {
  const match = await matchService.acceptMatchRequest(req.params.matchId, req.user.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, match, SUCCESS_MESSAGES.MATCH_ACCEPTED)
  );
});

/**
 * Reject match request
 */
export const rejectMatchRequest = asyncHandler(async (req, res) => {
  const match = await matchService.rejectMatchRequest(req.params.matchId, req.user.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, match, SUCCESS_MESSAGES.MATCH_REJECTED)
  );
});

/**
 * Get sent match requests
 */
export const getSentMatchRequests = asyncHandler(async (req, res) => {
  const result = await matchService.getSentMatchRequests(req.user.id, req.query);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Sent match requests retrieved successfully')
  );
});

/**
 * Get received match requests
 */
export const getReceivedMatchRequests = asyncHandler(async (req, res) => {
  const result = await matchService.getReceivedMatchRequests(req.user.id, req.query);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Received match requests retrieved successfully')
  );
});

/**
 * Get accepted matches
 */
export const getAcceptedMatches = asyncHandler(async (req, res) => {
  const result = await matchService.getAcceptedMatches(req.user.id, req.query);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Accepted matches retrieved successfully')
  );
});

/**
 * Delete match
 */
export const deleteMatch = asyncHandler(async (req, res) => {
  await matchService.deleteMatch(req.params.matchId, req.user.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Match deleted successfully')
  );
});

export const matchController = {
  sendMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  getSentMatchRequests,
  getReceivedMatchRequests,
  getAcceptedMatches,
  deleteMatch,
};
