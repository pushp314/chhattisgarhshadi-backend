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
 * @swagger
 * /api/v1/uploads/profile-photo:
 *   post:
 *     summary: Upload single profile photo
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 */
router.post(
  '/profile-photo',
  uploadProfilePhoto,
  handleMulterError,
  uploadController.uploadProfilePhoto
);

/**
 * @swagger
 * /api/v1/uploads/profile-photos:
 *   post:
 *     summary: Upload multiple profile photos (up to 6)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 */
router.post(
  '/profile-photos',
  uploadProfilePhotos,
  handleMulterError,
  uploadController.uploadProfilePhotos
);

/**
 * @swagger
 * /api/v1/uploads/id-proof:
 *   post:
 *     summary: Upload ID proof (PDF or image)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: ID proof uploaded successfully
 */
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