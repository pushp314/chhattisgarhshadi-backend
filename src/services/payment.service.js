import { razorpayInstance, getWebhookSecret, isRazorpayConfigured } from '../config/razorpay.js';
import { config } from '../config/config.js'; // Import config for KEY_SECRET
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import {
  HTTP_STATUS,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
  USER_ROLES,
} from '../utils/constants.js';
import { logger } from '../config/logger.js';
import crypto from 'crypto';
import { getSocketIoInstance } from '../socket/index.js';

/**
 * Create Razorpay order
 * @param {number} userId - User ID
 * @param {number} planId - The ID of the subscription plan
 * @returns {Promise<Object>}
 */
export const createOrder = async (userId, planId) => {
  try {
    // Check if Razorpay is configured
    if (!isRazorpayConfigured()) {
      throw new ApiError(
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        'Payment service is not configured. Please contact administrator.'
      );
    }
    // 1. Find the plan to get the secure amount
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'Subscription plan not found or is not active'
      );
    }

    const amount = plan.price; // Secure amount from DB
    const durationInDays = plan.duration;

    // 2. Create a PENDING UserSubscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationInDays);

    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId,
        status: SUBSCRIPTION_STATUS.PENDING,
        startDate: new Date(),
        endDate,
      },
    });

    // 3. Create a PENDING Payment record linked to the subscription
    const payment = await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount,
        currency: 'INR',
        status: PAYMENT_STATUS.PENDING,
        // We will add razorpayOrderId after creating the order
      },
    });

    // 4. Create Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `sub_${subscription.id}_pay_${payment.id}`, // Unique receipt
      notes: {
        userId,
        subscriptionId: subscription.id,
        planId: plan.id,
      },
    });

    // 5. Update our payment record with the Razorpay Order ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
        transactionId: `txn_${payment.id}`, // Use our internal ID for tracking
      },
    });

    logger.info(
      `Payment order created: ${razorpayOrder.id} for subscription ${subscription.id}`
    );

    // 6. Return order details to the client
    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // Amount in paise
      currency: razorpayOrder.currency,
      paymentId: payment.id,
      key: config.RAZORPAY_KEY_ID, // Send key to client
    };
  } catch (error) {
    logger.error('Error in createOrder:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create payment order'
    );
  }
};

/**
 * Verify payment signature (for client-side confirmation)
 * @param {Object} data - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {Promise<Object>}
 */
export const verifyPayment = async (data) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    const text = razorpay_order_id + '|' + razorpay_payment_id;

    // CRITICAL FIX: Use KEY_SECRET, not WEBHOOK_SECRET
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid payment signature');
    }

    // This check is for client-side feedback.
    // The webhook will handle the actual activation.
    const payment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        status: PAYMENT_STATUS.PENDING,
      },
    });

    if (!payment) {
      // Payment might already be processed by webhook, which is fine
      logger.warn(
        `Client verification for already processed order: ${razorpay_order_id}`
      );
      return {
        success: true,
        paymentId: razorpay_payment_id,
        message: 'Payment already processed',
      };
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: PAYMENT_STATUS.SUCCESS, // Mark as "SUCCESS" (client verified)
        paymentMethod: 'Razorpay', // Placeholder
        paidAt: new Date(),
      },
    });

    logger.info(`Payment verified by client: ${razorpay_payment_id}`);

    return { success: true, paymentId: razorpay_payment_id };
  } catch (error) {
    logger.error('Error in verifyPayment:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Payment verification failed'
    );
  }
};

/**
 * Handle payment webhook (Source of Truth for activation)
 * @param {Object} event - Webhook event body
 * @param {string} signature - Webhook signature
 * @returns {Promise<Object>}
 */
export const handleWebhook = async (event, signature) => {
  try {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', getWebhookSecret()) // Correctly uses Webhook Secret
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
      // Add other events as needed, e.g., 'refund.processed'
      default:
        logger.info(`Unhandled webhook event: ${eventType}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in handleWebhook:', error);
    throw error; // Let the controller handle the response
  }
};

/**
 * Handle payment captured event (Activates subscription)
 * @param {Object} paymentEntity - Razorpay payment entity
 */
const handlePaymentCaptured = async (paymentEntity) => {
  const razorpayOrderId = paymentEntity.order_id;

  try {
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: { subscription: true },
    });

    if (!payment) {
      logger.error(
        `Webhook Error: Payment not found for order ID: ${razorpayOrderId}`
      );
      return;
    }

    // Idempotency check: If payment is already completed, do nothing
    if (payment.status === PAYMENT_STATUS.COMPLETED) {
      logger.warn(`Webhook Info: Payment ${payment.id} is already completed.`);
      return;
    }

    if (!payment.subscriptionId) {
      logger.error(`Webhook Error: Payment ${payment.id} has no subscriptionId.`);
      return;
    }

    // CRITICAL FIX: Update all related models in a transaction
    await prisma.$transaction([
      // 1. Update Payment
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: paymentEntity.id,
          status: PAYMENT_STATUS.COMPLETED,
          paidAt: new Date(),
          paymentMethod: paymentEntity.method,
        },
      }),
      // 2. Activate Subscription
      prisma.userSubscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
      }),
      // 3. Upgrade User Role
      prisma.user.update({
        where: { id: payment.userId },
        data: {
          role: USER_ROLES.PREMIUM_USER,
        },
      }),
    ]);

    // 4. (Optional but recommended) Emit socket event to user
    const io = getSocketIoInstance();
    if (io) {
      io.to(`user:${payment.userId}`).emit('SUBSCRIPTION_ACTIVATED', {
        planId: payment.subscription.planId,
        endDate: payment.subscription.endDate,
      });
    }

    logger.info(`Payment captured and subscription activated: ${payment.id}`);
  } catch (error) {
    logger.error(
      `Error in handlePaymentCaptured for order ${razorpayOrderId}:`,
      error
    );
  }
};

/**
 * Handle payment failed event
 * @param {Object} paymentEntity - Razorpay payment entity
 */
const handlePaymentFailed = async (paymentEntity) => {
  const razorpayOrderId = paymentEntity.order_id;

  try {
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
    });

    if (!payment || payment.status === PAYMENT_STATUS.FAILED) {
      return; // Not found or already marked as failed
    }

    await prisma.$transaction([
      // 1. Mark Payment as FAILED
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUS.FAILED,
          failureReason:
            paymentEntity.error_description || 'Payment failed at gateway',
        },
      }),
      // 2. Mark Subscription as FAILED
      prisma.userSubscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: SUBSCRIPTION_STATUS.CANCELLED, // Or FAILED if you add it
        },
      }),
    ]);

    logger.info(`Payment failed and subscription cancelled: ${payment.id}`);
  } catch (error) { // <-- FIX: Added opening brace
    logger.error(
      `Error in handlePaymentFailed for order ${razorpayOrderId}:`,
      error
    );
  } // <-- FIX: Added closing brace
}; // <-- FIX: Moved semicolon to end of function expression

/**
 * Get payment by ID
 * @param {number} paymentId - Payment ID (validated)
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
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        subscription: {
          include: {
            plan: true,
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
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Error retrieving payment'
    );
  }
};

/**
 * Get user payments
 * @param {number} userId - User ID
 * @returns {Promise<Array>}
 */
export const getUserPayments = async (userId) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments;
  } catch (error) {
    logger.error('Error in getUserPayments:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Error retrieving payments'
    );
  }
};

export const paymentService = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentById,
  getUserPayments,
};