/**
 * Recommendations Routes
 * /api/v1/recommendations/*
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getRecommendations,
    getSuperMatchesHandler,
    getMatchScore,
} from '../controllers/recommendations.controller.js';

const router = express.Router();

// Get daily recommendations
router.get('/', authenticate, getRecommendations);

// Get super matches (85%+)
router.get('/super-matches', authenticate, getSuperMatchesHandler);

// Get match score with specific user
router.get('/score/:userId', authenticate, getMatchScore);

export default router;
