import axios from 'axios';
import { config } from './config.js';
import { logger } from './logger.js';

const MSG91_BASE_URL = 'https://api.msg91.com/api/v5';

/**
 * Check if MSG91 is configured
 * @returns {boolean}
 */
export const isMsg91Configured = () => !!config.MSG91_AUTH_KEY;

/**
 * MSG91 API configuration
 */
export const msg91Config = {
  authKey: config.MSG91_AUTH_KEY,
  senderId: config.MSG91_SENDER_ID,
  templateId: config.MSG91_TEMPLATE_ID,
  baseUrl: MSG91_BASE_URL,
};

/**
 * Create axios instance for MSG91 API calls (only if configured)
 */
export const msg91Client = isMsg91Configured()
  ? axios.create({
      baseURL: MSG91_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'authkey': config.MSG91_AUTH_KEY,
      },
    })
  : null;

if (isMsg91Configured()) {
  logger.info('MSG91 API client initialized successfully');
} else {
  logger.warn('MSG91 is not configured. SMS features will be disabled.');
}

/**
 * Get MSG91 configuration
 * @returns {Object}
 */
export const getMsg91Config = () => msg91Config;
