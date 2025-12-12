/**
 * Boost Routes
 * /api/v1/boost/*
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getPackages,
    getActive,
    activate,
    getFeaturedProfiles,
} from '../controllers/boost.controller.js';

const router = express.Router();

// Get all boost packages (public)
router.get('/packages', getPackages);

// Get featured/boosted profiles (public)
router.get('/featured', getFeaturedProfiles);

// Get user's active boost (authenticated)
router.get('/active', authenticate, getActive);

// Activate a boost (authenticated)
router.post('/activate', authenticate, activate);

export default router;
