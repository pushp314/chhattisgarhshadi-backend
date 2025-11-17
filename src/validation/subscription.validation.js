import { z } from 'zod';

// Schema for paginating the subscription plan list
export const getPlansSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});