import { z } from 'zod';

// Regex for an Indian phone number (10 digits, starting with 6, 7, 8, or 9)
const phoneRegex = /^[6-9]\d{9}$/;

// Schema for Google Mobile Auth
export const googleMobileAuthSchema = z.object({
  body: z.object({
    idToken: z.string({ required_error: 'idToken is required' }).min(1, 'idToken cannot be empty'),
    deviceInfo: z.object({}).passthrough().optional(), // Allow any device info object
  }),
});

// Schema for Refresh Token
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'refreshToken is required' }).min(1, 'refreshToken cannot be empty'),
  }),
});

// Schema for Logout
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional(), // Refresh token is optional for "logout all"
  }),
});

// Schema for sending OTP
export const sendPhoneOTPSchema = z.object({
  body: z.object({
    phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
    countryCode: z.string().startsWith('+').optional(),
  }),
});

// Schema for verifying OTP
export const verifyPhoneOTPSchema = z.object({
  body: z.object({
    phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});