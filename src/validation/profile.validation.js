import { z } from 'zod';
import {
  GENDER,
  MARITAL_STATUS,
  RELIGION,
  MOTHER_TONGUE,
  EDUCATION_LEVEL, // ADDED: Import from constants.js
  OCCUPATION_TYPE, // ADDED: Import from constants.js
  // TODO: Add other enums to constants.js for fields below
} from '../utils/constants.js';

// Helper for string-to-array transformation
const stringToArray = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim());
  return [];
}, z.array(z.string()));

// This object includes all user-editable fields from the Profile schema.
// All are optional for flexibility, except for the most basic required fields.
const profileBodyBase = {
  // Basic Information
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  middleName: z.string().optional(), // ADDED
  displayName: z.string().optional(), // ADDED
  dateOfBirth: z.string().datetime('Invalid date format. Must be ISO 8601'),
  gender: z.nativeEnum(GENDER),
  maritalStatus: z.nativeEnum(MARITAL_STATUS),

  // Religious Information
  religion: z.nativeEnum(RELIGION),
  motherTongue: z.nativeEnum(MOTHER_TONGUE),
  caste: z.string().min(2).optional(), // FIX: Made optional to match schema
  subCaste: z.string().optional(),
  gothram: z.string().optional(), // ADDED

  // Chhattisgarh-Specific
  nativeDistrict: z.string().optional(),
  nativeTehsil: z.string().optional(),
  nativeVillage: z.string().optional(),
  speaksChhattisgarhi: z.boolean().optional(), // Use optional, not default

  // Physical Attributes
  height: z.number().int().positive().min(100).max(250).optional(), // FIX: Made optional
  weight: z.number().int().positive().optional(),
  bloodGroup: z.string().optional(), // ADDED
  complexion: z.string().optional(), // ADDED (Recommend z.nativeEnum(COMPLEXION))
  bodyType: z.string().optional(), // ADDED (Recommend z.nativeEnum(BODY_TYPE))
  physicalDisability: z.string().max(1000).optional(), // ADDED

  // Lifestyle
  diet: z.string().optional(), // (Recommend z.nativeEnum(DIET))
  smokingHabit: z.string().optional(), // (Recommend z.nativeEnum(SMOKING_HABIT))
  drinkingHabit: z.string().optional(), // (Recommend z.nativeEnum(DRINKING_HABIT))

  // Location
  country: z.string().min(2, 'Country is required'),
  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  residencyStatus: z.string().optional(), // ADDED

  // About
  bio: z.string().max(1000).optional(),
  hobbies: z.string().optional(),
  interests: z.string().optional(), // ADDED
  aboutFamily: z.string().max(1000).optional(),
  partnerExpectations: z.string().max(1000).optional(),

  // Family Information
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherStatus: z.string().optional(), // ADDED (Recommend z.nativeEnum(PARENT_STATUS))
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherStatus: z.string().optional(), // ADDED (Recommend z.nativeEnum(PARENT_STATUS))
  numberOfBrothers: z.number().int().min(0).optional(),
  numberOfSisters: z.number().int().min(0).optional(),
  brothersMarried: z.number().int().min(0).optional(), // ADDED
  sistersMarried: z.number().int().min(0).optional(), // ADDED
  familyType: z.string().optional(), // ADDED (Recommend z.nativeEnum(FAMILY_TYPE))
  familyValues: z.string().optional(), // ADDED (Recommend z.nativeEnum(FAMILY_VALUES))
  familyStatus: z.string().optional(), // ADDED (Recommend z.nativeEnum(FAMILY_STATUS))
  familyIncome: z.string().optional(), // ADDED
  ancestralOrigin: z.string().optional(), // ADDED

  // Horoscope
  manglik: z.boolean().optional(), // ADDED
  birthTime: z.string().optional(), // ADDED
  birthPlace: z.string().optional(), // ADDED
  rashi: z.string().optional(), // ADDED
  nakshatra: z.string().optional(), // ADDED

  // Education (summary)
  highestEducation: z.nativeEnum(EDUCATION_LEVEL).optional(), // FIX: Use enum
  educationDetails: z.string().max(1000).optional(), // ADDED
  collegeName: z.string().optional(), // ADDED

  // Occupation (summary)
  occupationType: z.nativeEnum(OCCUPATION_TYPE).optional(), // FIX: Use enum
  occupation: z.string().optional(),
  designation: z.string().optional(), // ADDED
  companyName: z.string().optional(), // ADDED
  annualIncome: z.string().optional(),
  workLocation: z.string().optional(), // ADDED
};

export const createProfileSchema = z.object({
  body: z.object({
    // Required fields
    firstName: profileBodyBase.firstName,
    lastName: profileBodyBase.lastName,
    dateOfBirth: profileBodyBase.dateOfBirth,
    gender: profileBodyBase.gender,
    maritalStatus: profileBodyBase.maritalStatus,
    religion: profileBodyBase.religion,
    motherTongue: profileBodyBase.motherTongue,
    country: profileBodyBase.country,
    state: profileBodyBase.state,
    city: profileBodyBase.city,

    // All other fields are optional on creation
    ...Object.keys(profileBodyBase)
      .filter(key => ![
        'firstName', 'lastName', 'dateOfBirth', 'gender', 'maritalStatus', 
        'religion', 'motherTongue', 'country', 'state', 'city'
      ].includes(key))
      .reduce((obj, key) => {
        obj[key] = profileBodyBase[key].optional();
        return obj;
      }, {}),
  }).strict(), // Use .strict() to reject fields not in the schema
});

export const updateProfileSchema = z.object({
  body: z.object(
    // All fields are optional on update
    Object.keys(profileBodyBase).reduce((obj, key) => {
      obj[key] = profileBodyBase[key].optional();
      return obj;
    }, {})
  ).strict(), // .strict() prevents users from updating system fields
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
    nativeDistrict: z.string().optional(), // ADDED: For Chhattisgarh search
    speaksChhattisgarhi: z.coerce.boolean().optional(), // ADDED: For Chhattisgarh search
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