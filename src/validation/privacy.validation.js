import { z } from 'zod';
import { 
  // GENDER, // Removed
  // MARITAL_STATUS, // Removed
  // RELIGION, // Removed
  // MOTHER_TONGUE, // Removed
  EDUCATION_LEVEL, 
  // OCCUPATION_TYPE, // Removed
  PROFILE_VISIBILITY, 
  PRIVACY_LEVEL,
  COMMUNICATION_PRIVACY,
  MESSAGE_PRIVACY,
  TWO_FACTOR_METHOD, // ADDED
} from '../utils/constants.js';

// Helper to convert single string to array for fields that support multiple values
const flexibleArray = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.length > 0) return val.split(',').map(s => s.trim());
  if (typeof val === 'string' && val.length === 0) return [];
  return val;
}, z.array(z.string()).optional().nullable());


// Schema for updating profile privacy settings
export const upsertProfilePrivacySchema = z.object({
  body: z.object({
    profileVisibility: z.nativeEnum(PROFILE_VISIBILITY).optional(),
    showLastName: z.boolean().optional(),
    showExactAge: z.boolean().optional(),
    showDateOfBirth: z.boolean().optional(),
    showPhoneNumber: z.nativeEnum(PRIVACY_LEVEL).optional(),
    showEmail: z.nativeEnum(PRIVACY_LEVEL).optional(),
    showSocialMedia: z.nativeEnum(PRIVACY_LEVEL).optional(),
    showExactLocation: z.boolean().optional(),
    showCity: z.boolean().optional(),
    showState: z.boolean().optional(),
    showCompanyName: z.boolean().optional(),
    showAnnualIncome: z.nativeEnum(PRIVACY_LEVEL).optional(),
    showWorkLocation: z.boolean().optional(),
    showFamilyDetails: z.nativeEnum(PRIVACY_LEVEL).optional(),
    showParentOccupation: z.boolean().optional(),
    showSiblingDetails: z.boolean().optional(),
    showHoroscope: z.boolean().optional(),
    showHoroscopeTo: z.nativeEnum(PRIVACY_LEVEL).optional(),
    showBirthTime: z.boolean().optional(),
    showBirthPlace: z.boolean().optional(),
    showDiet: z.boolean().optional(),
    showSmokingDrinking: z.nativeEnum(PRIVACY_LEVEL).optional(),
    showLastActive: z.boolean().optional(),
    showOnlineStatus: z.boolean().optional(),
    showProfileViews: z.boolean().optional(),
    showWhoViewedProfile: z.boolean().optional(),
    showShortlistedBy: z.boolean().optional(),
    showNativeDistrict: z.boolean().optional(),
    showNativeVillage: z.boolean().optional(),
  }).strict(),
});

// Schema for updating communication preferences
export const upsertCommunicationSettingsSchema = z.object({
  body: z.object({
    allowMatchRequestsFrom: z.nativeEnum(COMMUNICATION_PRIVACY).optional(),
    minAgeForRequests: z.coerce.number().int().min(18).optional().nullable(),
    maxAgeForRequests: z.coerce.number().int().max(100).optional().nullable(),
    allowedReligions: flexibleArray,
    allowedLocations: flexibleArray,
    minEducationLevel: z.nativeEnum(EDUCATION_LEVEL).optional().nullable(),
    allowMessagesFrom: z.nativeEnum(MESSAGE_PRIVACY).optional(),
    blockUnverifiedProfiles: z.boolean().optional(),
    requireMinProfileCompleteness: z.coerce.number().int().min(0).max(100).optional(),
    allowAnonymousViews: z.boolean().optional(),
    notifyOnView: z.boolean().optional(),
    blockRepeatedViews: z.boolean().optional(),
    autoResponseEnabled: z.boolean().optional(),
    autoResponseMessage: z.string().max(1000).optional().nullable(),
    sendAutoResponseToNewMatches: z.boolean().optional(),
    maxMatchRequestsPerDay: z.coerce.number().int().positive().optional(),
    maxMessagesPerDay: z.coerce.number().int().positive().optional(),
    preferChhattisgarhi: z.boolean().optional(),
  }).strict(),
});

// Schema for updating search visibility settings
export const upsertSearchVisibilitySchema = z.object({
  body: z.object({
    showInSearch: z.boolean().optional(),
    showInSuggestions: z.boolean().optional(),
    visibleToFreeUsers: z.boolean().optional(),
    visibleToPremiumUsers: z.boolean().optional(),
    visibleToVerifiedUsers: z.boolean().optional(),
    showOnlyInCountry: z.boolean().optional(),
    showOnlyInState: z.boolean().optional(),
    showOnlyInCity: z.boolean().optional(),
    excludedCountries: flexibleArray,
    showOnlyToAgeRange: z.boolean().optional(),
    visibleMinAge: z.coerce.number().int().min(18).optional().nullable(),
    visibleMaxAge: z.coerce.number().int().max(100).optional().nullable(),
    incognitoEnabled: z.boolean().optional(),
    hideFromSearch: z.boolean().optional(),
    hideLastActive: z.boolean().optional(),
    browseAnonymously: z.boolean().optional(),
    profilePaused: z.boolean().optional(),
    pauseReason: z.string().max(100).optional().nullable(),
    pausedUntil: z.string().datetime().optional().nullable(),
    showOnlyInChhattisgarh: z.boolean().optional(),
    prioritizeChhattisgarhi: z.boolean().optional(),
  }).strict(),
});

// ADDED: Schema for updating account security settings
export const upsertAccountSecuritySchema = z.object({
  body: z.object({
    twoFactorEnabled: z.boolean().optional(),
    twoFactorMethod: z.nativeEnum(TWO_FACTOR_METHOD).optional().nullable(),
    requireOtpNewDevice: z.boolean().optional(),
    requireOtpNewLocation: z.boolean().optional(),
    sessionTimeout: z.coerce.number().int().positive().optional(),
    maxActiveSessions: z.coerce.number().int().positive().optional(),
    recoveryEmail: z.string().email().optional().nullable(),
    recoveryPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional().nullable(),
    // Note: 'twoFactorSecret' and 'backupCodes' should be handled by dedicated endpoints
    // 'recoveryEmailVerified' & 'recoveryPhoneVerified' should be read-only
  }).strict(),
});