import { z } from 'zod';
import { USER_ROLES, LANGUAGE } from '../utils/constants.js'; // Assuming you add LANGUAGE to constants.js

export const objectIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive('ID must be a positive integer'),
  }),
});

export const updateMeSchema = z.object({
  body: z.object({
    // Only allow specific, safe fields to be updated.
    // Do NOT allow 'role', 'email', 'googleId', etc.
    profilePicture: z.string().url('Invalid URL format').optional(),
    preferredLanguage: z.nativeEnum(LANGUAGE).optional(),
    // Add any other SAFE fields from the User model here
  }),
});

export const searchUsersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    role: z.nativeEnum(USER_ROLES).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});

// ADDED: Schema for registering an FCM token
export const registerFcmTokenSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'FCM token is required' }),
    deviceId: z.string({ required_error: 'deviceId is required' }),
    deviceType: z.enum(['IOS', 'ANDROID', 'WEB'], {
      required_error: 'deviceType must be one of: IOS, ANDROID, WEB',
    }),
    deviceName: z.string().optional(),
  }),
});