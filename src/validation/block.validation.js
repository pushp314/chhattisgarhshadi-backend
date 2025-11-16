import { z } from 'zod';

// Schema for blocking a user
export const createBlockSchema = z.object({
  body: z.object({
    blockedId: z.coerce
      .number({ invalid_type_error: 'blockedId must be a number' })
      .int()
      .positive('blockedId must be a positive integer'),
    reason: z.string().max(100).optional(),
  }),
});

// Schema for unblocking a user (by their ID in the URL)
export const blockedUserIdParamSchema = z.object({
  params: z.object({
    blockedId: z.coerce
      .number({ invalid_type_error: 'blockedId must be a number' })
      .int()
      .positive('blockedId must be a positive integer'),
  }),
});

// Schema for paginating the blocked list
export const getBlockedListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});