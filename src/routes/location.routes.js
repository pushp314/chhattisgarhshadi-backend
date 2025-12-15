/**
 * Location Routes
 * Handles PIN code to location lookup API endpoints
 */

const express = require('express');
const router = express.Router();
const locationService = require('../services/location.service');

/**
 * GET /api/v1/location
 * Lookup location by PIN code
 * 
 * Query Parameters:
 * - pincode: 6-digit Indian PIN code (required)
 * 
 * Response:
 * {
 *   success: true,
 *   data: { pincode, city, district, state, cached }
 * }
 */
router.get('/', async (req, res) => {
    try {
        const { pincode } = req.query;

        if (!pincode) {
            return res.status(400).json({
                success: false,
                error: 'PIN code is required. Usage: /api/v1/location?pincode=XXXXXX'
            });
        }

        const result = await locationService.getLocationByPincode(pincode.trim());

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.json(result);

    } catch (error) {
        console.error('[Location Route] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/v1/location/bulk
 * Bulk lookup multiple PIN codes (admin only)
 * 
 * Body:
 * { pincodes: ["492001", "492002", ...] }
 */
router.post('/bulk', async (req, res) => {
    try {
        const { pincodes } = req.body;

        if (!Array.isArray(pincodes) || pincodes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'pincodes array is required'
            });
        }

        // Limit bulk requests
        if (pincodes.length > 50) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 50 PIN codes per request'
            });
        }

        const results = await locationService.bulkLookup(pincodes);

        return res.json({
            success: true,
            data: Object.fromEntries(results)
        });

    } catch (error) {
        console.error('[Location Route] Bulk lookup error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/v1/location/validate/:pincode
 * Quick validation of PIN code format
 */
router.get('/validate/:pincode', (req, res) => {
    const { pincode } = req.params;
    const isValid = locationService.isValidPincode(pincode);

    return res.json({
        success: true,
        data: {
            pincode,
            valid: isValid
        }
    });
});

module.exports = router;
