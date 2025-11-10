import { razorpayInstance, getWebhookSecret } from '../config/razorpay.js';
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS, PAYMENT_STATUS } from '../utils/constants.js';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

/**
 * Create Razorpay order
 * @param {string} userId - User ID
 * @param {number} amount - Amount in INR
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>}
 */
export const createOrder = async (userId, amount, metadata = {}) => {
  try {
    // Create Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        ...metadata,
      },
    });

    // Store payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: 'INR',
        status: PAYMENT_STATUS.PENDING,
        razorpayOrderId: razorpayOrder.id,
      },
    });

    logger.info(`Payment order created: ${razorpayOrder.id}`);

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: payment.id,
    };
  } catch (error) {
    logger.error('Error in createOrder:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to create payment order');
  }
};

/**
 * Verify payment signature
 * @param {Object} data - Payment verification data
 * @returns {Promise<Object>}
 */
export const verifyPayment = async (data) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    // Generate signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', getWebhookSecret())
      .update(text)
      .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid payment signature');
    }

    // Update payment record
    const payment = await prisma.payment.updateMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        status: PAYMENT_STATUS.PENDING,
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: PAYMENT_STATUS.SUCCESS,
      },
    });

    if (payment.count === 0) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment record not found');
    }

    logger.info(`Payment verified: ${razorpay_payment_id}`);

    return { success: true, paymentId: razorpay_payment_id };
  } catch (error) {
    logger.error('Error in verifyPayment:', error);
    throw error;
  }
};

/**
 * Handle payment webhook
 * @param {Object} event - Webhook event
 * @param {string} signature - Webhook signature
 * @returns {Promise<Object>}
 */
export const handleWebhook = async (event, signature) => {
  try {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', getWebhookSecret())
      .update(JSON.stringify(event))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid webhook signature');
    }

    const { event: eventType, payload } = event;

    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      default:
        logger.info(`Unhandled webhook event: ${eventType}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in handleWebhook:', error);
    throw error;
  }
};

/**
 * Handle payment captured event
 * @param {Object} payment - Payment entity
 */
const handlePaymentCaptured = async (payment) => {
  try {
    await prisma.payment.updateMany({
      where: {
        razorpayOrderId: payment.order_id,
      },
      data: {
        razorpayPaymentId: payment.id,
        status: PAYMENT_STATUS.SUCCESS,
      },
    });

    logger.info(`Payment captured: ${payment.id}`);
  } catch (error) {
    logger.error('Error in handlePaymentCaptured:', error);
  }
};

/**
 * Handle payment failed event
 * @param {Object} payment - Payment entity
 */
const handlePaymentFailed = async (payment) => {
  try {
    await prisma.payment.updateMany({
      where: {
        razorpayOrderId: payment.order_id,
      },
      data: {
        status: PAYMENT_STATUS.FAILED,
      },
    });

    logger.info(`Payment failed: ${payment.id}`);
  } catch (error) {
    logger.error('Error in handlePaymentFailed:', error);
  }
};

/**
 * Get payment by ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>}
 */
export const getPaymentById = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found');
    }

    return payment;
  } catch (error) {
    logger.error('Error in getPaymentById:', error);
    throw error;
  }
};

/**
 * Get user payments
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export const getUserPayments = async (userId) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments;
  } catch (error) {
    logger.error('Error in getUserPayments:', error);
    throw error;
  }
};

export const paymentService = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentById,
  getUserPayments,
};
