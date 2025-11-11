import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';
import {
  uploadProfilePhoto,
  uploadProfilePhotos,
  uploadDocument,
  handleMulterError,
} from '../middleware/upload.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/uploads/profile-photo
 * @desc    Upload single profile photo
 * @access  Private
 */
router.post(
  '/profile-photo',
  uploadProfilePhoto, // Multer middleware
  handleMulterError, // Multer error handler
  uploadController.uploadProfilePhoto // Controller
);

/**
 * @route   POST /api/uploads/profile-photos
 * @desc    Upload multiple profile photos (up to 6)
 * @access  Private
 */
router.post(
  '/profile-photos',
  uploadProfilePhotos, // Multer middleware
  handleMulterError, // Multer error handler
  uploadController.uploadProfilePhotos // Controller
);

/**
 * @route   POST /api/uploads/id-proof
 * @desc    Upload ID proof (PDF or image)
 * @access  Private
 */
router.post(
  '/id-proof',
  uploadDocument, // Multer middleware
  handleMulterError, // Multer error handler
  uploadController.uploadIdProof // Controller
);

//
// NOTE: The generic /single, /multiple, and /delete routes have been
// removed as they were either unused or a security risk.
// File deletion is handled via DELETE /api/profiles/photos/:mediaId
//

export default router;