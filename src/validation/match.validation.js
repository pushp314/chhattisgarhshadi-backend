import { z } from 'zod';
import { MatchRequestStatus } from '@prisma/client'; // Import enum directly from Prisma

export const sendMatchRequestSchema = z.object({
  body: z.object({
    toUserId: z.coerce
      .number({ invalid_type_error: 'toUserId must be a number' })
      .int()
      .positive('toUserId must be a positive integer'),
  }),
});

export const matchIdParamSchema = z.object({
  params: z.object({
    matchId: z.coerce
      .number({ invalid_type_error: 'matchId must be a number' })
      .int()
      .positive('matchId must be a positive integer'),
  }),
});

export const getMatchesQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(MatchRequestStatus).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});