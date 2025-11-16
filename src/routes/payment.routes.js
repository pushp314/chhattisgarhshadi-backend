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
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Handle Razorpay webhook
 *     tags: [Payments]
 *     description: Secured by Razorpay signature
 *     responses:
 *       200:
 *         description: Webhook handled successfully
 */
router.post('/webhook', paymentController.handleWebhook);

// All other routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/payments/orders:
 *   post:
 *     summary: Create payment order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment order created successfully
 */
router.post(
  '/orders',
  validate(createOrderSchema),
  paymentController.createOrder
);

/**
 * @swagger
 * /api/v1/payments/verify:
 *   post:
 *     summary: Verify payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post(
  '/verify',
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

/**
 * @swagger
 * /api/v1/payments/me:
 *   get:
 *     summary: Get my payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get('/me', paymentController.getMyPayments);

/**
 * @swagger
 * /api/v1/payments/{paymentId}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 */
router.get(
  '/:paymentId',
  validate(paymentIdParamSchema),
  paymentController.getPaymentById
);

export default router;