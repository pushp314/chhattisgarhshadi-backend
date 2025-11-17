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


router.post(
  '/profile-photo',
  uploadProfilePhoto,
  handleMulterError,
  uploadController.uploadProfilePhoto
);


router.post(
  '/profile-photos',
  uploadProfilePhotos,
  handleMulterError,
  uploadController.uploadProfilePhotos
);


router.post(
  '/id-proof',
  uploadDocument,
  handleMulterError,
  uploadController.uploadIdProof
);

//
// NOTE: The generic /single, /multiple, and /delete routes have been
// removed as they were either unused or a security risk.
// File deletion is handled via DELETE /api/profiles/photos/:mediaId
//

export default router;