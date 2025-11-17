import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import { createReportSchema } from '../validation/report.validation.js';

const router = Router();

// All report routes require authentications
router.use(authenticate, requireCompleteProfile);


router
  .route('/')
  .post(validate(createReportSchema), reportController.createReport);

export default router;