import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook
 * @access  Public (but secured by Razorpay signature)
 */
router.post('/webhook', paymentController.handleWebhook);

// All other routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/payments/orders
 * @desc    Create payment order
 * @access  Private
 */
router.post('/orders', paymentController.createOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment
 * @access  Private
 */
router.post('/verify', paymentController.verifyPayment);

/**
 * @route   GET /api/payments/me
 * @desc    Get my payments
 * @access  Private
 */
router.get('/me', paymentController.getMyPayments);

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get payment by ID
 * @access  Private
 */
router.get('/:paymentId', paymentController.getPaymentById);

export default router;
