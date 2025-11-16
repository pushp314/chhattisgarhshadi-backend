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

/**
 * @swagger
 * /api/v1/matches:
 *   post:
 *     summary: Send match request
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Match request sent successfully
 */
router.post('/', validate(sendMatchRequestSchema), matchController.sendMatchRequest);

/**
 * @swagger
 * /api/v1/matches/sent:
 *   get:
 *     summary: Get sent match requests
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent match requests retrieved successfully
 */
router.get('/sent', validate(getMatchesQuerySchema), matchController.getSentMatchRequests);

/**
 * @swagger
 * /api/v1/matches/received:
 *   get:
 *     summary: Get received match requests
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Received match requests retrieved successfully
 */
router.get(
  '/received',
  validate(getMatchesQuerySchema),
  matchController.getReceivedMatchRequests
);

/**
 * @swagger
 * /api/v1/matches/accepted:
 *   get:
 *     summary: Get accepted matches
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accepted matches retrieved successfully
 */
router.get(
  '/accepted',
  validate(getMatchesQuerySchema),
  matchController.getAcceptedMatches
);

/**
 * @swagger
 * /api/v1/matches/{matchId}/accept:
 *   post:
 *     summary: Accept match request
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match request accepted
 */
router.post(
  '/:matchId/accept',
  validate(matchIdParamSchema),
  matchController.acceptMatchRequest
);

/**
 * @swagger
 * /api/v1/matches/{matchId}/reject:
 *   post:
 *     summary: Reject match request
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match request rejected
 */
router.post(
  '/:matchId/reject',
  validate(matchIdParamSchema),
  matchController.rejectMatchRequest
);

/**
 * @swagger
 * /api/v1/matches/{matchId}:
 *   delete:
 *     summary: Delete/cancel match
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match deleted successfully
 */
router.delete(
  '/:matchId',
  validate(matchIdParamSchema),
  matchController.deleteMatch
);

export default router;