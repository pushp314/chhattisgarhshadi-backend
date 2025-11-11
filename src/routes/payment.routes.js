import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
  paymentIdParamSchema,
} from '../validation/payment.validation.js';
const router = Router();

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook
 * @access  Public (secured by Razorpay signature)
 */
// NOTE: This route MUST come before `express.json()` in your main app.js
// or Razorpay's body-parser will conflict.
// If you use express.json() globally, you must use a raw body parser for this route.
// For now, we assume it's correctly placed.
router.post('/webhook', paymentController.handleWebhook);

// All other routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/payments/orders
 * @desc    Create payment order
 * @access  Private
 */
router.post(
  '/orders',
  validate(createOrderSchema),
  paymentController.createOrder
);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment (for client-side confirmation)
 * @access  Private
 */
router.post(
  '/verify',
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

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
router.get(
  '/:paymentId',
  validate(paymentIdParamSchema),
  paymentController.getPaymentById
);

export default router;