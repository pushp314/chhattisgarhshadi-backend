import { Router } from 'express';
import { horoscopeController } from '../controllers/horoscope.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
    getHoroscopeMatchSchema,
    calculateGunaScoreSchema,
} from '../validation/horoscope.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get horoscope compatibility with a specific profile
 * GET /horoscope/match/:profileId
 */
router.get(
    '/match/:profileId',
    validate(getHoroscopeMatchSchema),
    horoscopeController.getHoroscopeMatch
);

/**
 * Calculate Guna Milan between any two profiles
 * POST /horoscope/calculate
 */
router.post(
    '/calculate',
    validate(calculateGunaScoreSchema),
    horoscopeController.calculateGunaScore
);

export default router;
