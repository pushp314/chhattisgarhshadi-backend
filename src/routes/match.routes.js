import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';

const router = Router();

// All routes require authentication and complete profile
router.use(authenticate, requireCompleteProfile);

/**
 * @route   POST /api/matches
 * @desc    Send match request
 * @access  Private
 */
router.post('/', matchController.sendMatchRequest);

/**
 * @route   GET /api/matches/sent
 * @desc    Get sent match requests
 * @access  Private
 */
router.get('/sent', matchController.getSentMatchRequests);

/**
 * @route   GET /api/matches/received
 * @desc    Get received match requests
 * @access  Private
 */
router.get('/received', matchController.getReceivedMatchRequests);

/**
 * @route   GET /api/matches/accepted
 * @desc    Get accepted matches
 * @access  Private
 */
router.get('/accepted', matchController.getAcceptedMatches);

/**
 * @route   PUT /api/matches/:matchId/accept
 * @desc    Accept match request
 * @access  Private
 */
router.put('/:matchId/accept', matchController.acceptMatchRequest);

/**
 * @route   PUT /api/matches/:matchId/reject
 * @desc    Reject match request
 * @access  Private
 */
router.put('/:matchId/reject', matchController.rejectMatchRequest);

/**
 * @route   DELETE /api/matches/:matchId
 * @desc    Delete match
 * @access  Private
 */
router.delete('/:matchId', matchController.deleteMatch);

export default router;
