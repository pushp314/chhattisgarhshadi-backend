import { Router } from 'express';
import { occupationController } from '../controllers/occupation.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createOccupationSchema,
  updateOccupationSchema,
  occupationIdParamSchema,
} from '../validation/occupation.validation.js';

const router = Router();

// All occupation routes require authentication
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/occupation:
 * post:
 * summary: Add an occupation entry to user's profile
 * tags: [Occupation]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CreateOccupation'
 * responses:
 * 201:
 * description: Occupation entry created successfully
 * get:
 * summary: Get all occupation entries for the logged-in user
 * tags: [Occupation]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: List of occupation entries
 */
router
  .route('/')
  .post(validate(createOccupationSchema), occupationController.createOccupation)
  .get(occupationController.getMyOccupations);

/**
 * @swagger
 * /api/v1/occupation/{id}:
 * put:
 * summary: Update a specific occupation entry
 * tags: [Occupation]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpdateOccupation'
 * responses:
 * 200:
 * description: Occupation entry updated successfully
 * delete:
 * summary: Delete a specific occupation entry
 * tags: [Occupation]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Occupation entry deleted successfully
 */
router
  .route('/:id')
  .put(validate(updateOccupationSchema), occupationController.updateOccupation)
  .delete(validate(occupationIdParamSchema), occupationController.deleteOccupation);

export default router;