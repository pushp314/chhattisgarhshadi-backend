import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  sendMatchRequestSchema,
  matchIdParamSchema,
  getMatchesQuerySchema,
} from '../validations/match.validation.js';

const router = Router();

// All routes require authentication and a complete profile
router.use(authenticate, requireCompleteProfile);

/**
 * @route   POST /api/matches
 * @desc    Send match request
 * @access  Private
 */
router.post('/', validate(sendMatchRequestSchema), matchController.sendMatchRequest);

/**
 * @route   GET /api/matches/sent
 * @desc    Get sent match requests
 * @access  Private
 */
router.get('/sent', validate(getMatchesQuerySchema), matchController.getSentMatchRequests);

/**
 * @route   GET /api/matches/received
 * @desc    Get received match requests
 * @access  Private
 */
router.get(
  '/received',
  validate(getMatchesQuerySchema),
  matchController.getReceivedMatchRequests
);

/**
 * @route   GET /api/matches/accepted
 * @desc    Get accepted matches
 * @access  Private
 */
router.get(
  '/accepted',
  validate(getMatchesQuerySchema),
  matchController.getAcceptedMatches
);

/**
 * @route   PUT /api/matches/:matchId/accept
 * @desc    Accept match request
 * @access  Private
 */
router.put(
  '/:matchId/accept',
  validate(matchIdParamSchema),
  matchController.acceptMatchRequest
);

/**
 * @route   PUT /api/matches/:matchId/reject
 * @desc    Reject match request
 * @access  Private
 */
router.put(
  '/:matchId/reject',
  validate(matchIdParamSchema),
  matchController.rejectMatchRequest
);

/**
 * @route   DELETE /api/matches/:matchId
 * @desc    Delete/cancel match
 * @access  Private
 */
router.delete(
  '/:matchId',
  validate(matchIdParamSchema),
  matchController.deleteMatch
);

export default router;