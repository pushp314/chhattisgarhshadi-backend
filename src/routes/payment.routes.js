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

router.post('/webhook', paymentController.handleWebhook);

// All other routes require authentication
router.use(authenticate);

router.post(
  '/orders',
  validate(createOrderSchema),
  paymentController.createOrder
);

router.post(
  '/verify',
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

// Upgrade existing subscription (carries over remaining days)
router.post(
  '/upgrade',
  validate(createOrderSchema), // Same validation - needs planId
  paymentController.createUpgradeOrder
);

router.get('/me', paymentController.getMyPayments);


router.get(
  '/:paymentId',
  validate(paymentIdParamSchema),
  paymentController.getPaymentById
);

export default router;