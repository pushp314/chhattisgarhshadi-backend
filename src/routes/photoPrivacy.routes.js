import { Router } from 'express';
import { photoPrivacyController } from '../controllers/photoPrivacy.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { 
  updatePhotoPrivacySchema 
} from '../validation/photoPrivacy.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/photos/{mediaId}/privacy:
 * get:
 * summary: Get privacy settings for a specific photo
 * tags: [Media]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: mediaId
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Photo privacy settings retrieved
 * put:
 * summary: Update privacy settings for a specific photo
 * tags: [Media]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: mediaId
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpdatePhotoPrivacy'
 * responses:
 * 200:
 * description: Photo privacy settings updated
 */
router
  .route('/:mediaId/privacy')
  .get(
    validate(updatePhotoPrivacySchema.pick({ params: true })), // Only validate params
    photoPrivacyController.getMyPhotoSettings
  )
  .put(
    validate(updatePhotoPrivacySchema),
    photoPrivacyController.updateMyPhotoSettings
  );

export default router;