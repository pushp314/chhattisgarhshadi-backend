import axios from 'axios';
import { config } from './config.js';
import { logger } from './logger.js';

const MSG91_BASE_URL = 'https://api.msg91.com/api/v5';

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
 * Create axios instance for MSG91 API calls
 */
export const msg91Client = axios.create({
  baseURL: MSG91_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'authkey': config.MSG91_AUTH_KEY,
  },
});

logger.info('MSG91 API client initialized successfully');

/**
 * Get MSG91 configuration
 * @returns {Object}
 */
export const getMsg91Config = () => msg91Config;
