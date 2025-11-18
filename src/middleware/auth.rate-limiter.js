import rateLimit from 'express-rate-limit';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Stricter rate limiter for authentication routes
 * 10 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 auth requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Even stricter rate limiter for sending OTP
 * 3 requests per 15 minutes per IP
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 OTP requests per 15 minutes
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 15 minutes.',
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});