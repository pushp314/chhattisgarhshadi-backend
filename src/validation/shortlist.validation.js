import { z } from 'zod';

// Schema for adding a user to the shortlist (body)
export const createShortlistSchema = z.object({
  body: z.object({
    shortlistedUserId: z.coerce
      .number({ invalid_type_error: 'shortlistedUserId must be a number' })
      .int()
      .positive('shortlistedUserId must be a positive integer'),
    note: z.string().max(500).optional(),
  }),
});

// Schema for removing a user from the shortlist (URL param)
export const shortlistedUserIdParamSchema = z.object({
  params: z.object({
    shortlistedUserId: z.coerce
      .number({ invalid_type_error: 'shortlistedUserId must be a number' })
      .int()
      .positive('shortlistedUserId must be a positive integer'),
  }),
});

// Schema for paginating the shortlist
export const getShortlistSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});