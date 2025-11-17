import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  sendMatchRequestSchema,
  matchIdParamSchema,
  getMatchesQuerySchema,
} from '../validation/match.validation.js';

const router = Router();

// All routes require authentication and a complete profile
router.use(authenticate, requireCompleteProfile);

router.post('/', validate(sendMatchRequestSchema), matchController.sendMatchRequest);


router.get('/sent', validate(getMatchesQuerySchema), matchController.getSentMatchRequests);

router.get(
  '/received',
  validate(getMatchesQuerySchema),
  matchController.getReceivedMatchRequests
);


router.get(
  '/accepted',
  validate(getMatchesQuerySchema),
  matchController.getAcceptedMatches
);


router.post(
  '/:matchId/accept',
  validate(matchIdParamSchema),
  matchController.acceptMatchRequest
);


router.post(
  '/:matchId/reject',
  validate(matchIdParamSchema),
  matchController.rejectMatchRequest
);


router.delete(
  '/:matchId',
  validate(matchIdParamSchema),
  matchController.deleteMatch
);

export default router;