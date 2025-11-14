import Razorpay from 'razorpay';
import { config } from './config.js';
import { logger } from './logger.js';

/**
 * Check if Razorpay is configured
 * @returns {boolean}
 */
export const isRazorpayConfigured = () => {
  return !!(config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET);
};

/**
 * Initialize Razorpay instance (only if configured)
 */
export const razorpayInstance = isRazorpayConfigured()
  ? new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    })
  : null;

if (isRazorpayConfigured()) {
  logger.info('Razorpay client initialized successfully');
} else {
  logger.warn('Razorpay is not configured. Payment features will be disabled.');
}

/**
 * Get Razorpay webhook secret
 * @returns {string}
 */
export const getWebhookSecret = () => config.RAZORPAY_WEBHOOK_SECRET;