import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { paymentService } from '../services/payment.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants.js';

/**
 * Create payment order
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body; // Securely get planId

  // The service now handles fetching the amount and creating the subscription
  const order = await paymentService.createOrder(req.user.id, planId);

  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        order,
        'Payment order created successfully'
      )
    );
});

/**
 * Verify payment
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  // req.body is pre-validated by Zod
  const result = await paymentService.verifyPayment(req.body);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, SUCCESS_MESSAGES.PAYMENT_SUCCESS)
    );
});

/**
 * Handle Razorpay webhook
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  await paymentService.handleWebhook(req.body, signature);

  // Respond to Razorpay immediately
  res.status(HTTP_STATUS.OK).json({ status: 'ok' });
});

/**
 * Get payment by ID
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  // req.params.paymentId is pre-validated by Zod
  const payment = await paymentService.getPaymentById(req.params.paymentId);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, payment, 'Payment retrieved successfully'));
});

/**
 * Get my payments
 */
export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getUserPayments(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, payments, 'Payments retrieved successfully'));
});

export const paymentController = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentById,
  getMyPayments,
};