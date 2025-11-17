import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { contactRequestService } from '../services/contactRequest.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Create a new contact request
 */
export const createContactRequest = asyncHandler(async (req, res) => {
  const request = await contactRequestService.createContactRequest(req.user.id, req.body);
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        request,
        'Contact request sent successfully'
      )
    );
});

/**
 * Get all contact requests sent by the logged-in user
 */
export const getSentRequests = asyncHandler(async (req, res) => {
  const result = await contactRequestService.getSentRequests(req.user.id, req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Sent requests retrieved successfully')
    );
});

/**
 * Get all contact requests received by the logged-in user
 */
export const getReceivedRequests = asyncHandler(async (req, res) => {
  const result = await contactRequestService.getReceivedRequests(req.user.id, req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Received requests retrieved successfully')
    );
});

/**
 * Respond to a received contact request
 */
export const respondToRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  const updatedRequest = await contactRequestService.respondToRequest(
    req.user.id,
    id,
    status
  );
  
  const message = status === 'APPROVED' ? 'Request approved' : 'Request rejected';
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, updatedRequest, message));
});


export const contactRequestController = {
  createContactRequest,
  getSentRequests,
  getReceivedRequests,
  respondToRequest,
};