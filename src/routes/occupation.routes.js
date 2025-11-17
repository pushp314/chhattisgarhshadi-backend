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


router
  .route('/')
  .post(validate(createOccupationSchema), occupationController.createOccupation)
  .get(occupationController.getMyOccupations);


router
  .route('/:id')
  .put(validate(updateOccupationSchema), occupationController.updateOccupation)
  .delete(validate(occupationIdParamSchema), occupationController.deleteOccupation);

export default router;