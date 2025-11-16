import { z } from 'zod';
// Import any enums you create for these, e.g., DIET, SMOKING_HABIT
// For now, we'll use z.string() or z.array(z.string())

// Helper to convert single string to array for fields that support multiple values
const flexibleArray = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.length > 0) return [val];
  return val;
}, z.array(z.string()).optional().nullable());

export const upsertPreferenceSchema = z.object({
  body: z.object({
    // Age Preference
    ageFrom: z.coerce.number().int().positive().optional().nullable(),
    ageTo: z.coerce.number().int().positive().optional().nullable(),

    // Height Preference
    heightFrom: z.coerce.number().int().positive().optional().nullable(),
    heightTo: z.coerce.number().int().positive().optional().nullable(),

    // Religion & Caste (Allowing arrays of strings)
    religion: flexibleArray,
    caste: flexibleArray,
    motherTongue: flexibleArray,

    // Marital Status (Allowing array of statuses)
    maritalStatus: flexibleArray,

    // Location (Allowing arrays of locations)
    country: flexibleArray,
    state: flexibleArray,
    city: flexibleArray,
    residencyStatus: flexibleArray,

    // Chhattisgarh-Specific (NEW)
    nativeDistrict: flexibleArray,
    mustSpeakChhattisgarhi: z.boolean().optional().nullable(),

    // Education & Occupation (Allowing arrays)
    education: flexibleArray,
    occupation: flexibleArray,
    annualIncome: z.string().optional().nullable(), // This is VarChar(100)

    // Lifestyle
    diet: flexibleArray,
    smoking: z.string().optional().nullable(), // This is VarChar(30)
    drinking: z.string().optional().nullable(), // This is VarChar(30)

    // Horoscope
    manglik: z.boolean().optional().nullable(),

    // Other
    description: z.string().max(1000).optional().nullable(),
  }).strict(),
});