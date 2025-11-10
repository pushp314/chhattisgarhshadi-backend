import { msg91Client, getMsg91Config } from '../config/msg91.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../config/logger.js';
import { generateOTP } from '../utils/helpers.js';

/**
 * Send OTP via SMS
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to send (optional, will generate if not provided)
 * @returns {Promise<Object>}
 */
export const sendOTP = async (phone, otp = null) => {
  try {
    const config = getMsg91Config();
    const otpCode = otp || generateOTP(6);

    const payload = {
      sender: config.senderId,
      route: '4',
      country: '91',
      sms: [
        {
          message: `Your OTP for Chhattisgarh Shadi is ${otpCode}. Valid for 10 minutes. Do not share with anyone.`,
          to: [phone],
        },
      ],
    };

    const response = await msg91Client.post('/flow', payload);

    logger.info(`OTP sent to ${phone}`);

    return {
      success: true,
      otp: otpCode,
      messageId: response.data?.message_id || null,
    };
  } catch (error) {
    logger.error('Error sending OTP:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to send OTP');
  }
};

/**
 * Verify OTP
 * Note: This is a basic implementation. In production, you should store OTPs
 * in Redis or database with expiry and implement proper verification
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 * @param {string} storedOtp - OTP stored in system
 * @returns {boolean}
 */
export const verifyOTP = (phone, otp, storedOtp) => {
  try {
    if (otp === storedOtp) {
      logger.info(`OTP verified for ${phone}`);
      return true;
    }
    
    logger.warn(`OTP verification failed for ${phone}`);
    return false;
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    return false;
  }
};

/**
 * Send SMS notification
 * @param {string} phone - Phone number
 * @param {string} message - Message to send
 * @returns {Promise<Object>}
 */
export const sendSMS = async (phone, message) => {
  try {
    const config = getMsg91Config();

    const payload = {
      sender: config.senderId,
      route: '4',
      country: '91',
      sms: [
        {
          message,
          to: [phone],
        },
      ],
    };

    const response = await msg91Client.post('/flow', payload);

    logger.info(`SMS sent to ${phone}`);

    return {
      success: true,
      messageId: response.data?.message_id || null,
    };
  } catch (error) {
    logger.error('Error sending SMS:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to send SMS');
  }
};

/**
 * Send template SMS
 * @param {string} phone - Phone number
 * @param {string} templateId - MSG91 template ID
 * @param {Object} variables - Template variables
 * @returns {Promise<Object>}
 */
export const sendTemplateSMS = async (phone, templateId, variables = {}) => {
  try {
    const config = getMsg91Config();

    const payload = {
      template_id: templateId || config.templateId,
      short_url: '0',
      mobiles: phone,
      ...variables,
    };

    const response = await msg91Client.post('/flow', payload);

    logger.info(`Template SMS sent to ${phone}`);

    return {
      success: true,
      messageId: response.data?.message_id || null,
    };
  } catch (error) {
    logger.error('Error sending template SMS:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to send template SMS');
  }
};

/**
 * Send match notification SMS
 * @param {string} phone - Phone number
 * @param {string} userName - Name of user who sent match request
 * @returns {Promise<Object>}
 */
export const sendMatchNotificationSMS = async (phone, userName) => {
  const message = `You have received a new match request from ${userName} on Chhattisgarh Shadi. Login to view and respond.`;
  return await sendSMS(phone, message);
};

/**
 * Send message notification SMS
 * @param {string} phone - Phone number
 * @param {string} userName - Name of user who sent message
 * @returns {Promise<Object>}
 */
export const sendMessageNotificationSMS = async (phone, userName) => {
  const message = `You have received a new message from ${userName} on Chhattisgarh Shadi. Login to view.`;
  return await sendSMS(phone, message);
};

export const smsService = {
  sendOTP,
  verifyOTP,
  sendSMS,
  sendTemplateSMS,
  sendMatchNotificationSMS,
  sendMessageNotificationSMS,
};
