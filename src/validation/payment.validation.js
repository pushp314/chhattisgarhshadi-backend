import { z } from 'zod';

// 1. Schema for POST /api/payments/orders
export const createOrderSchema = z.object({
  body: z.object({
    // Needs planId to know which subscription to buy
    planId: z.coerce
      .number({ invalid_type_error: 'planId must be a number' })
      .int()
      .positive('planId must be a positive integer'),
  }),
});

// 2. Schema for POST /api/payments/verify
// This schema validates the data returned from the client-side Razorpay checkout
export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string({ required_error: 'razorpay_order_id is required' }),
    razorpay_payment_id: z.string({ required_error: 'razorpay_payment_id is required' }),
    razorpay_signature: z.string({ required_error: 'razorpay_signature is required' }),
  }),
});

// 3. Schema for GET /api/payments/:paymentId
export const paymentIdParamSchema = z.object({
  params: z.object({
    // Coerces the string parameter into a number for validation
    paymentId: z.coerce
      .number({ invalid_type_error: 'paymentId must be a number' })
      .int()
      .positive('paymentId must be a positive integer'),
  }),
});