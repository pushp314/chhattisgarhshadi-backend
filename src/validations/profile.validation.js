import { z } from 'zod';
import {
  GENDER,
  MARITAL_STATUS,
  RELIGION,
  MOTHER_TONGUE,
} from '../utils/constants.js'; // You must add these enums to constants.js

// Helper for string-to-array transformation
const stringToArray = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim());
  return [];
}, z.array(z.string()));

export const createProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    dateOfBirth: z.string().datetime('Invalid date format. Must be ISO 8601'), // e.g., "1990-10-25T00:00:00.000Z"
    gender: z.nativeEnum(GENDER),
    maritalStatus: z.nativeEnum(MARITAL_STATUS),
    religion: z.nativeEnum(RELIGION),
    motherTongue: z.nativeEnum(MOTHER_TONGUE),
    caste: z.string().min(2, 'Caste is required'),
    country: z.string().min(2, 'Country is required'),
    state: z.string().min(2, 'State is required'),
    city: z.string().min(2, 'City is required'),
    height: z.number().int().positive().min(100).max(250),
    speaksChhattisgarhi: z.boolean().default(true),
    nativeDistrict: z.string().optional(),
    bio: z.string().max(1000).optional(),
    // Add other *required* fields here
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    // Only allow specific, safe fields to be updated.
    // Do NOT allow 'isVerified', 'profileCompleteness', 'userId', etc.
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.nativeEnum(GENDER).optional(),
    maritalStatus: z.nativeEnum(MARITAL_STATUS).optional(),
    religion: z.nativeEnum(RELIGION).optional(),
    motherTongue: z.nativeEnum(MOTHER_TONGUE).optional(),
    caste: z.string().min(2).optional(),
    subCaste: z.string().optional(),
    country: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    city: z.string().min(2).optional(),
    height: z.number().int().positive().min(100).max(250).optional(),
    weight: z.number().int().positive().optional(),
    bio: z.string().max(1000).optional(),
    hobbies: z.string().optional(),
    aboutFamily: z.string().max(1000).optional(),
    partnerExpectations: z.string().max(1000).optional(),
    // Family
    fatherName: z.string().optional(),
    fatherOccupation: z.string().optional(),
    motherName: z.string().optional(),
    motherOccupation: z.string().optional(),
    numberOfBrothers: z.number().int().min(0).optional(),
    numberOfSisters: z.number().int().min(0).optional(),
    // Education & Occupation
    highestEducation: z.string().optional(),
    occupation: z.string().optional(),
    annualIncome: z.string().optional(),
    // Location
    nativeDistrict: z.string().optional(),
    nativeTehsil: z.string().optional(),
    nativeVillage: z.string().optional(),
    speaksChhattisgarhi: z.boolean().optional(),
    // Lifestyle
    diet: z.string().optional(),
    smokingHabit: z.string().optional(),
    drinkingHabit: z.string().optional(),
  }).strict(), // .strict() throws an error if extra fields (like 'isVerified') are present
});

export const searchProfilesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    gender: z.nativeEnum(GENDER).optional(),
    minAge: z.coerce.number().int().min(18).optional(),
    maxAge: z.coerce.number().int().max(100).optional(),
    religions: stringToArray.optional(), // e.g., ?religions=HINDU,MUSLIM
    castes: stringToArray.optional(),
    maritalStatus: z.nativeEnum(MARITAL_STATUS).optional(),
    minHeight: z.coerce.number().int().optional(),
    maxHeight: z.coerce.number().int().optional(),
  }),
});

export const objectIdSchema = z.object({
  params: z.object({
    userId: z.coerce.number().int().positive('User ID must be a positive integer'),
  }),
});

export const mediaIdSchema = z.object({
  params: z.object({
    mediaId: z.coerce.number().int().positive('Media ID must be a positive integer'),
  }),
});