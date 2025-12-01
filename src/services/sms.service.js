import axios from 'axios';
import { logger } from '../config/logger.js';

class SMSService {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.senderId = process.env.MSG9J_SENDER_ID || 'APPNIT';
    this.templateId = process.env.MSG91_TEMPLATE_ID;
    this.baseUrl = 'https://control.msg91.com/api/v5';
  }

  async sendOTP(phone, otp, countryCode = '+91') {
    try {
      if (!this.authKey) {
        logger.warn('MSG91_AUTH_KEY not configured, OTP not sent');
        // In development OR if explicitly enabled, log the OTP
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG_OTP === 'true') {
          logger.info(`📱 OTP for ${countryCode}${phone}: ${otp}`);
          return { success: true, dev: true };
        }
        throw new Error('SMS service not configured');
      }

      // Log the request payload for debugging
      const payload = {
        sender: this.senderId,
        short_url: '0',
        mobiles: countryCode + phone,
        var1: otp,
        template_id: this.templateId,
      };

      logger.info(`📤 Sending OTP via MSG91 to ${countryCode}${phone}`);
      logger.info(`MSG91 Payload: ${JSON.stringify(payload)}`);

      const response = await axios.post(
        `${this.baseUrl}/flow/`,
        payload,
        {
          headers: {
            'authkey': this.authKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Log the full response for debugging
      logger.info(`MSG91 Response: ${JSON.stringify(response.data)}`);

      if (!response.data || response.data.type !== 'success') {
        logger.error('❌ SMS sending failed:', response.data?.message || 'Unknown MSG91 error');
        logger.error('Full MSG91 error response:', JSON.stringify(response.data));
        throw new Error('Failed to send OTP');
      }

      logger.info(`✅ OTP sent to ${countryCode}${phone} (Request ID: ${response.data.request_id})`);

      // Also log the OTP if DEBUG_OTP is enabled
      if (process.env.DEBUG_OTP === 'true') {
        logger.info(`📱 DEBUG OTP for ${countryCode}${phone}: ${otp}`);
      }

      return { success: true, messageId: response.data.request_id };

    } catch (error) {
      logger.error('SMS sending failed:', error.message);

      // In development, still allow OTP flow
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📱 DEV OTP for ${countryCode}${phone}: ${otp}`);
        return { success: true, dev: true };
      }

      throw new Error('Failed to send OTP');
    }
  }
}

export default new SMSService();