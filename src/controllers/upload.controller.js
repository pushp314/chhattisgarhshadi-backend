import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadService } from '../services/upload.service.js';
import { profileService } from '../services/profile.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants.js';

/**
 * Upload single file
 */
export const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
  }

  const result = await uploadService.uploadToS3(req.file, 'uploads');

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, SUCCESS_MESSAGES.UPLOAD_SUCCESS)
  );
});

/**
 * Upload multiple files
 */
export const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No files uploaded');
  }

  const results = await uploadService.uploadMultipleToS3(req.files, 'uploads');

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, results, SUCCESS_MESSAGES.UPLOAD_SUCCESS)
  );
});

/**
 * Upload profile photo
 */
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
  }

  // Process and upload image with thumbnail
  const result = await uploadService.processAndUploadImage(req.file, 'profile-photos');

  // Add photo to user profile
  await profileService.addPhoto(req.user.id, result.original.url);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Profile photo uploaded successfully')
  );
});

/**
 * Upload multiple profile photos
 */
export const uploadProfilePhotos = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No files uploaded');
  }

  const uploadPromises = req.files.map(file =>
    uploadService.processAndUploadImage(file, 'profile-photos')
  );

  const results = await Promise.all(uploadPromises);

  // Add all photos to user profile
  for (const result of results) {
    await profileService.addPhoto(req.user.id, result.original.url);
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, results, 'Profile photos uploaded successfully')
  );
});

/**
 * Upload ID proof
 */
export const uploadIdProof = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
  }

  const result = await uploadService.uploadToS3(req.file, 'id-proofs');

  // Update profile with ID proof URL
  await profileService.updateProfile(req.user.id, { idProof: result.url });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'ID proof uploaded successfully')
  );
});

/**
 * Delete file
 */
export const deleteFile = asyncHandler(async (req, res) => {
  const { url } = req.body;

  const key = uploadService.extractKeyFromUrl(url);
  await uploadService.deleteFromS3(key);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'File deleted successfully')
  );
});

export const uploadController = {
  uploadSingle,
  uploadMultiple,
  uploadProfilePhoto,
  uploadProfilePhotos,
  uploadIdProof,
  deleteFile,
};
