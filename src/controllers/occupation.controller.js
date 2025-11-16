import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { occupationService } from '../services/occupation.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Create new occupation entry
 */
export const createOccupation = asyncHandler(async (req, res) => {
  const occupation = await occupationService.createOccupation(req.user.id, req.body);
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(HTTP_STATUS.CREATED, occupation, 'Occupation added successfully')
    );
});

/**
 * Get all occupation entries for the logged-in user
 */
export const getMyOccupations = asyncHandler(async (req, res) => {
  const occupationList = await occupationService.getMyOccupations(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        occupationList,
        'Occupations retrieved successfully'
      )
    );
});

/**
 * Update an occupation entry
 */
export const updateOccupation = asyncHandler(async (req, res) => {
  const updatedOccupation = await occupationService.updateOccupation(
    req.user.id,
    req.params.id,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updatedOccupation,
        'Occupation updated successfully'
      )
    );
});

/**
 * Delete an occupation entry
 */
export const deleteOccupation = asyncHandler(async (req, res) => {
  await occupationService.deleteOccupation(req.user.id, req.params.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, null, 'Occupation deleted successfully')
    );
});

export const occupationController = {
  createOccupation,
  getMyOccupations,
  updateOccupation,
  deleteOccupation,
};