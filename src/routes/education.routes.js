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


router
  .route('/')
  .post(validate(createEducationSchema), educationController.createEducation)
  .get(educationController.getMyEducation);


router
  .route('/:id')
  .put(validate(updateEducationSchema), educationController.updateEducation)
  .delete(validate(educationIdParamSchema), educationController.deleteEducation);

export default router;