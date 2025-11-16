import { Router } from 'express';
import { educationController } from '../controllers/education.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createEducationSchema,
  updateEducationSchema,
  educationIdParamSchema,
} from '../validation/education.validation.js';

const router = Router();

// All education routes require authentication
// We also use requireCompleteProfile as education is part of a profile
router.use(authenticate, requireCompleteProfile);

/**
 * @swagger
 * /api/v1/education:
 * post:
 * summary: Add an education entry to user's profile
 * tags: [Education]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CreateEducation'
 * responses:
 * 201:
 * description: Education entry created successfully
 * get:
 * summary: Get all education entries for the logged-in user
 * tags: [Education]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: List of education entries
 */
router
  .route('/')
  .post(validate(createEducationSchema), educationController.createEducation)
  .get(educationController.getMyEducation);

/**
 * @swagger
 * /api/v1/education/{id}:
 * put:
 * summary: Update a specific education entry
 * tags: [Education]
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
 * $ref: '#/components/schemas/UpdateEducation'
 * responses:
 * 200:
 * description: Education entry updated successfully
 * delete:
 * summary: Delete a specific education entry
 * tags: [Education]
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
 * description: Education entry deleted successfully
 */
router
  .route('/:id')
  .put(validate(updateEducationSchema), educationController.updateEducation)
  .delete(validate(educationIdParamSchema), educationController.deleteEducation);

export default router;