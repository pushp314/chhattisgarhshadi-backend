import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  sendMatchRequestSchema,
  matchIdParamSchema,
  getMatchesQuerySchema,
} from '../validation/match.validation.js';
// ADDED: Import cache middleware for performance
import { cacheMatches, cacheMiddleware } from '../middleware/cache.middleware.js';

const router = Router();

// All routes require authentication and a complete profile
router.use(authenticate, requireCompleteProfile);

router.post('/', validate(sendMatchRequestSchema), matchController.sendMatchRequest);

// GET routes - cached for 10 minutes for performance
router.get(
  '/sent',
  validate(getMatchesQuerySchema),
  cacheMiddleware({ prefix: 'matches:sent:', ttl: 600, keyGenerator: (req) => `matches:sent:${req.user?.id}:${req.query.page || 1}` }),
  matchController.getSentMatchRequests
);

router.get(
  '/received',
  validate(getMatchesQuerySchema),
  cacheMiddleware({ prefix: 'matches:received:', ttl: 600, keyGenerator: (req) => `matches:received:${req.user?.id}:${req.query.page || 1}` }),
  matchController.getReceivedMatchRequests
);

router.get(
  '/accepted',
  validate(getMatchesQuerySchema),
  cacheMiddleware({ prefix: 'matches:accepted:', ttl: 600, keyGenerator: (req) => `matches:accepted:${req.user?.id}:${req.query.page || 1}` }),
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