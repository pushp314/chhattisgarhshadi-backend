import { z } from 'zod';

// Regex for an Indian phone number (10 digits, starting with 6, 7, 8, or 9)
const phoneRegex = /^[6-9]\d{9}$/;

// Schema for Google Mobile Auth (supports both flows)
export const googleMobileAuthSchema = z.object({
  body: z.object({
    // Web-Based OAuth flow (NEW)
    authorizationCode: z.string().min(1).optional(),
    redirectUri: z.string().url().optional(),
    // Legacy idToken flow (BACKWARD COMPATIBILITY)
    idToken: z.string().min(1).optional(),
    deviceInfo: z.object({}).passthrough().optional(), // Allow any device info object
    
    // --- ADDED: Optional agentCode ---
    agentCode: z.string().max(20).optional(),
    // --- End of Add ---

  }).refine(
    (data) => data.authorizationCode || data.idToken,
    {
      message: 'Either authorizationCode or idToken is required',
      path: ['authorizationCode'],
    }
  ),
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