import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { photoRequestService } from '../services/photoRequest.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Create a new photo view request
 */
export const createPhotoRequest = asyncHandler(async (req, res) => {
  const request = await photoRequestService.createPhotoRequest(req.user.id, req.body);
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        request,
        'Photo view request sent successfully'
      )
    );
});

/**
 * Get all photo view requests sent by the logged-in user
 */
export const getSentRequests = asyncHandler(async (req, res) => {
  const result = await photoRequestService.getSentRequests(req.user.id, req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Sent requests retrieved successfully')
    );
});

/**
 * Get all photo view requests received by the logged-in user
 */
export const getReceivedRequests = asyncHandler(async (req, res) => {
  const result = await photoRequestService.getReceivedRequests(req.user.id, req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Received requests retrieved successfully')
    );
});

/**
 * Respond to a received photo view request
 */
export const respondToRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  const updatedRequest = await photoRequestService.respondToRequest(
    req.user.id,
    id,
    status
  );
  
  const message = status === 'APPROVED' ? 'Request approved' : 'Request rejected';
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, updatedRequest, message));
});


export const photoRequestController = {
  createPhotoRequest,
  getSentRequests,
  getReceivedRequests,
  respondToRequest,
};