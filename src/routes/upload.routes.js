import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';
import {
  uploadSingleImage,
  uploadMultipleImages,
  uploadProfilePhoto,
  uploadProfilePhotos,
  uploadDocument,
  handleMulterError,
} from '../middleware/upload.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/uploads/single
 * @desc    Upload single file
 * @access  Private
 */
router.post(
  '/single',
  uploadSingleImage,
  handleMulterError,
  uploadController.uploadSingle
);

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
router.post(
  '/multiple',
  uploadMultipleImages,
  handleMulterError,
  uploadController.uploadMultiple
);

/**
 * @route   POST /api/uploads/profile-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
  '/profile-photo',
  uploadProfilePhoto,
  handleMulterError,
  uploadController.uploadProfilePhoto
);

/**
 * @route   POST /api/uploads/profile-photos
 * @desc    Upload multiple profile photos
 * @access  Private
 */
router.post(
  '/profile-photos',
  uploadProfilePhotos,
  handleMulterError,
  uploadController.uploadProfilePhotos
);

/**
 * @route   POST /api/uploads/id-proof
 * @desc    Upload ID proof
 * @access  Private
 */
router.post(
  '/id-proof',
  uploadDocument,
  handleMulterError,
  uploadController.uploadIdProof
);

/**
 * @route   DELETE /api/uploads
 * @desc    Delete file
 * @access  Private
 */
router.delete('/', uploadController.deleteFile);

export default router;
