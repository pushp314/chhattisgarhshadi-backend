/**
 * Web Payment Routes
 * Handles browser-based payment flow with Razorpay
 * Flow: App opens URL -> User pays -> Redirects back to app via deep link
 */

import express from 'express';
import { paymentService } from '../services/payment.service.js';
import { config } from '../config/config.js';
import prisma from '../config/database.js';
import jwt from 'jsonwebtoken';
import path from 'path';

const router = express.Router();

// Deep link scheme for the app
const APP_DEEP_LINK = 'chhattisgarhshaadi://';
const WEBSITE_URL = 'https://www.chhattisgarhshadi.com';


/**
 * Generate a temporary payment token for web checkout
 * POST /api/v1/web/payment/create-link
 */
router.post('/payment/create-link', async (req, res) => {
    try {
        const { userId, planId } = req.body;

        if (!userId || !planId) {
            return res.status(400).json({
                success: false,
                error: 'userId and planId are required'
            });
        }

        // Create the Razorpay order using existing service
        const order = await paymentService.createOrder(userId, planId);

        // Get plan details for display
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId }
        });

        // Generate a secure token for the payment session
        const paymentToken = jwt.sign(
            {
                userId,
                planId,
                orderId: order.orderId,
                paymentId: order.paymentId,
                amount: order.amount
            },
            config.JWT_ACCESS_SECRET,
            { expiresIn: '30m' } // Token valid for 30 minutes
        );

        // Generate the payment URL
        const paymentUrl = `${WEBSITE_URL}/pay?token=${paymentToken}`;

        res.json({
            success: true,
            data: {
                paymentUrl,
                orderId: order.orderId,
                amount: order.amount,
                currency: order.currency,
                planName: plan?.name,
                planDuration: plan?.duration
            }
        });

    } catch (error) {
        console.error('[Web Payment] Error creating payment link:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to create payment link'
        });
    }
});

/**
 * Verify token and return payment details for checkout page
 * GET /api/v1/web/payment/details?token=xxx
 */
router.get('/payment/details', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Payment token is required'
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);

        // Get user and plan details
        const [user, plan] = await Promise.all([
            prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    phone: true,
                    email: true,
                    profile: {
                        select: { firstName: true, lastName: true }
                    }
                }
            }),
            prisma.subscriptionPlan.findUnique({
                where: { id: decoded.planId }
            })
        ]);

        if (!user || !plan) {
            return res.status(404).json({
                success: false,
                error: 'User or plan not found'
            });
        }

        res.json({
            success: true,
            data: {
                orderId: decoded.orderId,
                amount: decoded.amount,
                currency: 'INR',
                razorpayKey: config.RAZORPAY_KEY_ID,
                user: {
                    name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User',
                    email: user.email || '',
                    phone: user.phone || ''
                },
                plan: {
                    name: plan.name,
                    duration: plan.duration,
                    features: plan.features || []
                },
                deepLinkSuccess: `${APP_DEEP_LINK}subscription/success?orderId=${decoded.orderId}`,
                deepLinkFailure: `${APP_DEEP_LINK}subscription/failed?orderId=${decoded.orderId}`
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Payment link has expired. Please try again.'
            });
        }
        console.error('[Web Payment] Error getting payment details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment details'
        });
    }
});

/**
 * Handle successful payment and redirect to app
 * POST /api/v1/web/payment/success
 */
router.post('/payment/success', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify payment using existing service
        const result = await paymentService.verifyPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        if (result.success) {
            // Redirect to app with success
            const successUrl = `${APP_DEEP_LINK}subscription/success?orderId=${razorpay_order_id}&paymentId=${razorpay_payment_id}`;
            res.json({
                success: true,
                redirectUrl: successUrl
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Payment verification failed'
            });
        }

    } catch (error) {
        console.error('[Web Payment] Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Payment verification failed'
        });
    }
});

/**
 * Handle payment failure
 * POST /api/v1/web/payment/failed
 */
router.post('/payment/failed', async (req, res) => {
    const { orderId, reason } = req.body;

    const failureUrl = `${APP_DEEP_LINK}subscription/failed?orderId=${orderId}&reason=${encodeURIComponent(reason || 'Payment failed')}`;

    res.json({
        success: false,
        redirectUrl: failureUrl
    });
});

// ==================== BOOST PAYMENT ENDPOINTS ====================

import profileBoostService from '../services/profileBoost.service.js';
import { razorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import { activateBoost, BOOST_PACKAGES } from '../services/profileBoost.service.js';
import crypto from 'crypto';


/**
 * Generate a temporary payment token for boost web checkout
 * POST /api/v1/web/boost/create-link
 */
router.post('/boost/create-link', async (req, res) => {
    try {
        const { userId, boostType } = req.body;

        if (!userId || !boostType) {
            return res.status(400).json({
                success: false,
                error: 'userId and boostType are required'
            });
        }

        if (!isRazorpayConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'Payment service not configured'
            });
        }

        // Find boost package
        let boostPackage = BOOST_PACKAGES[boostType];
        if (!boostPackage && boostType) {
            const lowerType = boostType.toLowerCase();
            boostPackage = Object.values(BOOST_PACKAGES).find(p => p.id === boostType || p.id === lowerType);
        }

        if (!boostPackage) {
            return res.status(400).json({
                success: false,
                error: 'Invalid boost package'
            });
        }

        // Create Razorpay order
        const order = await razorpayInstance.orders.create({
            amount: boostPackage.price * 100,
            currency: 'INR',
            receipt: `boost_${userId}_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                boostType,
                type: 'BOOST'
            }
        });

        // Generate a secure token for the payment session
        const paymentToken = jwt.sign(
            {
                userId,
                boostType,
                boostId: boostPackage.id,
                orderId: order.id,
                amount: order.amount,
                type: 'BOOST'
            },
            config.JWT_ACCESS_SECRET,
            { expiresIn: '30m' }
        );

        // Generate the payment URL
        const paymentUrl = `${WEBSITE_URL}/pay-boost?token=${paymentToken}`;

        res.json({
            success: true,
            data: {
                paymentUrl,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                boostName: boostPackage.name,
                boostDuration: boostPackage.durationHours
            }
        });

    } catch (error) {
        console.error('[Web Boost Payment] Error creating payment link:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create boost payment link'
        });
    }
});

/**
 * Verify token and return boost payment details for checkout page
 * GET /api/v1/web/boost/details?token=xxx
 */
router.get('/boost/details', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Payment token is required'
            });
        }

        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);

        if (decoded.type !== 'BOOST') {
            return res.status(400).json({
                success: false,
                error: 'Invalid boost payment token'
            });
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                phone: true,
                email: true,
                profile: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get boost package
        const boostPackage = Object.values(BOOST_PACKAGES).find(p => p.id === decoded.boostId) || BOOST_PACKAGES[decoded.boostType];

        res.json({
            success: true,
            data: {
                orderId: decoded.orderId,
                amount: decoded.amount,
                currency: 'INR',
                razorpayKey: config.RAZORPAY_KEY_ID,
                user: {
                    name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User',
                    email: user.email || '',
                    phone: user.phone || ''
                },
                boost: {
                    id: boostPackage?.id,
                    name: boostPackage?.name,
                    duration: boostPackage?.durationHours,
                    description: boostPackage?.description
                },
                boostType: decoded.boostType,
                deepLinkSuccess: `${APP_DEEP_LINK}boost/success?orderId=${decoded.orderId}`,
                deepLinkFailure: `${APP_DEEP_LINK}boost/failed?orderId=${decoded.orderId}`
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Payment link has expired. Please try again.'
            });
        }
        console.error('[Web Boost Payment] Error getting payment details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get boost payment details'
        });
    }
});

/**
 * Handle successful boost payment and redirect to app
 * POST /api/v1/web/boost/success
 */
router.post('/boost/success', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, boostType, userId } = req.body;

        // Verify signature
        const text = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment signature'
            });
        }

        // Activate the boost
        if (userId && boostType) {
            await activateBoost(parseInt(userId), boostType, razorpay_payment_id);
        }

        const successUrl = `${APP_DEEP_LINK}boost/success?orderId=${razorpay_order_id}&paymentId=${razorpay_payment_id}`;
        res.json({
            success: true,
            redirectUrl: successUrl
        });

    } catch (error) {
        console.error('[Web Boost Payment] Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Boost payment verification failed'
        });
    }
});

export default router;

