/**
 * Astrology Routes
 * /api/v1/astrology/*
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getNakshatraList,
    getRashiList,
    getMatch,
} from '../controllers/astrology.controller.js';

const router = express.Router();

// Get nakshatra list (public)
router.get('/nakshatras', getNakshatraList);

// Get rashi list (public)
router.get('/rashis', getRashiList);

// Get compatibility match (authenticated)
router.get('/match/:targetUserId', authenticate, getMatch);

export default router;
