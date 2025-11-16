import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { educationService } from '../services/education.service.js';
// FIX: Removed SUCCESS_MESSAGES as it was not used
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Create new education entry
 */
export const createEducation = asyncHandler(async (req, res) => {
  const education = await educationService.createEducation(req.user.id, req.body);
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(HTTP_STATUS.CREATED, education, 'Education added successfully')
    );
});

/**
 * Get all education entries for the logged-in user
 */
export const getMyEducation = asyncHandler(async (req, res) => {
  const educationList = await educationService.getMyEducation(req.user.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        educationList,
        'Education retrieved successfully'
      )
    );
});

/**
 * Update an education entry
 */
export const updateEducation = asyncHandler(async (req, res) => {
  const updatedEducation = await educationService.updateEducation(
    req.user.id,
    req.params.id,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updatedEducation,
        'Education updated successfully'
      )
    );
});

/**
 * Delete an education entry
 */
export const deleteEducation = asyncHandler(async (req, res) => {
  await educationService.deleteEducation(req.user.id, req.params.id);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, null, 'Education deleted successfully')
    );
});

export const educationController = {
  createEducation,
  getMyEducation,
  updateEducation,
  deleteEducation,
};