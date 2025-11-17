import { z } from 'zod';
import { LANGUAGE } from '../utils/constants.js';

// Regex for HH:MM time format
const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
const invalidTimeMsg = 'Invalid time format. Must be HH:MM';

// Schema for updating notification preferences
export const upsertNotificationSettingsSchema = z.object({
  body: z.object({
    // Match Request
    matchRequestInApp: z.boolean().optional(),
    matchRequestSms: z.boolean().optional(),
    matchRequestEmail: z.boolean().optional(),
    matchRequestPush: z.boolean().optional(),

    // Match Accepted
    matchAcceptedInApp: z.boolean().optional(),
    matchAcceptedSms: z.boolean().optional(),
    matchAcceptedEmail: z.boolean().optional(),
    matchAcceptedPush: z.boolean().optional(),

    // New Message
    newMessageInApp: z.boolean().optional(),
    newMessageSms: z.boolean().optional(),
    newMessageEmail: z.boolean().optional(),
    newMessagePush: z.boolean().optional(),

    // Profile Activity
    profileViewInApp: z.boolean().optional(),
    profileViewEmail: z.boolean().optional(),
    shortlistedInApp: z.boolean().optional(),
    shortlistedPush: z.boolean().optional(),

    // Subscription
    subscriptionExpiryInApp: z.boolean().optional(),
    subscriptionExpirySms: z.boolean().optional(),
    subscriptionExpiryEmail: z.boolean().optional(),

    // Security
    securityAlertsInApp: z.boolean().optional(),
    securityAlertsSms: z.boolean().optional(),
    securityAlertsEmail: z.boolean().optional(),

    // Marketing
    promotionalOffersEmail: z.boolean().optional(),
    promotionalOffersSms: z.boolean().optional(),
    newsletterEmail: z.boolean().optional(),

    // General
    enableAllNotifications: z.boolean().optional(),
    notificationLanguage: z.nativeEnum(LANGUAGE).optional(),

    // Quiet Hours
    quietHoursEnabled: z.boolean().optional(),
    quietHoursStart: z.string().regex(timeRegex, invalidTimeMsg).optional().nullable(),
    quietHoursEnd: z.string().regex(timeRegex, invalidTimeMsg).optional().nullable(),

    // Digest Mode
    digestModeEnabled: z.boolean().optional(),
    digestFrequency: z.string().max(10).optional(), // e.g., 'DAILY', 'WEEKLY'
    digestTime: z.string().regex(timeRegex, invalidTimeMsg).optional(),

  }).strict(),
});