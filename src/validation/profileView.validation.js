import { z } from 'zod';

// Schema for logging a profile view
export const logProfileViewSchema = z.object({
  body: z.object({
    // This is the userId of the person being viewed.
    // The schema model calls it 'profileId'
    profileId: z.coerce
      .number({ invalid_type_error: 'profileId must be a number' })
      .int()
      .positive('profileId must be a positive integer'),
    
    isAnonymous: z.boolean().optional().default(false),
  }),
});

// Schema for paginating the view lists
export const getProfileViewsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});