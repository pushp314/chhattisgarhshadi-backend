import Razorpay from 'razorpay';
import { config } from './config.js';
import { logger } from './logger.js';

/**
 * Initialize Razorpay instance
 */
export const razorpayInstance = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

logger.info('Razorpay client initialized successfully');

/**
 * Get Razorpay webhook secret
 * @returns {string}
 */
export const getWebhookSecret = () => config.RAZORPAY_WEBHOOK_SECRET;