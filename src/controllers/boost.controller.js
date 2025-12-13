/**
 * Profile Boost Controller
 * API endpoints for boost/spotlight/highlighter features
 */

import {
    activateBoost,
    getActiveBoost,
    getBoostPackages,
    getBoostedProfileIds,
} from '../services/profileBoost.service.js';
import { logger } from '../config/logger.js';

/**
 * GET /api/v1/boost/packages
 * Get all available boost packages
 */
export const getPackages = async (req, res) => {
    try {
        const packages = getBoostPackages();

        return res.status(200).json({
            success: true,
            data: packages,
        });
    } catch (error) {
        logger.error('Error getting boost packages:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get boost packages',
        });
    }
};

/**
 * GET /api/v1/boost/active
 * Get user's active boost status
 */
export const getActive = async (req, res) => {
    try {
        const userId = req.user.id;
        const activeBoost = await getActiveBoost(userId);

        return res.status(200).json({
            success: true,
            data: activeBoost,
            hasActiveBoost: !!activeBoost,
        });
    } catch (error) {
        logger.error('Error getting active boost:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get active boost',
        });
    }
};

/**
 * POST /api/v1/boost/activate
 * Activate a boost package
 * Body: { boostType: string, transactionId: string }
 */
export const activate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { boostType, transactionId } = req.body;

        if (!boostType || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'boostType and transactionId are required',
            });
        }

        const result = await activateBoost(userId, boostType, transactionId);

        return res.status(200).json({
            success: true,
            message: 'Boost activated successfully',
            data: result,
        });
    } catch (error) {
        logger.error('Error activating boost:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to activate boost',
        });
    }
};

/**
 * GET /api/v1/boost/featured
 * Get currently boosted profiles (for discovery page)
 */
export const getFeaturedProfiles = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const boostedProfiles = await getBoostedProfileIds(limit);

        return res.status(200).json({
            success: true,
            data: boostedProfiles,
        });
    } catch (error) {
        logger.error('Error getting featured profiles:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get featured profiles',
        });
    }
};

/**
 * POST /api/v1/boost/order
 * Create Razorpay order for boost purchase
 * Body: { boostType: string }
 */
export const createBoostOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { boostType } = req.body;

        if (!boostType) {
            return res.status(400).json({
                success: false,
                message: 'boostType is required',
            });
        }

        // Import Razorpay and packages
        const { razorpayInstance, isRazorpayConfigured } = await import('../config/razorpay.js');
        const { BOOST_PACKAGES } = await import('../services/profileBoost.service.js');

        if (!isRazorpayConfigured()) {
            return res.status(503).json({
                success: false,
                message: 'Payment service not configured',
            });
        }

        const boostPackage = BOOST_PACKAGES[boostType];
        if (!boostPackage) {
            return res.status(400).json({
                success: false,
                message: 'Invalid boost package',
            });
        }

        // Create Razorpay order
        const order = await razorpayInstance.orders.create({
            amount: boostPackage.price * 100, // Convert to paise
            currency: 'INR',
            receipt: `boost_${userId}_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                boostType,
                type: 'BOOST',
            },
        });

        // Get Razorpay key for frontend
        const { config } = await import('../config/config.js');

        return res.status(200).json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                razorpayKey: config.razorpay.keyId,
                boostPackage,
            },
        });
    } catch (error) {
        logger.error('Error creating boost order:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create order',
        });
    }
};

/**
 * POST /api/v1/boost/verify
 * Verify Razorpay payment and activate boost
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, boostType }
 */
export const verifyBoostPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, boostType } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !boostType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification fields',
            });
        }

        // Verify signature
        const { config } = await import('../config/config.js');
        const crypto = await import('crypto');

        const generatedSignature = crypto
            .createHmac('sha256', config.razorpay.keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature',
            });
        }

        // Activate boost
        const result = await activateBoost(userId, boostType, razorpay_payment_id);

        logger.info(`Boost payment verified and activated for user ${userId}: ${boostType}`);

        return res.status(200).json({
            success: true,
            message: 'Boost activated successfully!',
            data: result,
        });
    } catch (error) {
        logger.error('Error verifying boost payment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify payment',
        });
    }
};

export default {
    getPackages,
    getActive,
    activate,
    getFeaturedProfiles,
    createBoostOrder,
    verifyBoostPayment,
};
