import { z } from 'zod';
import { MEDIA_TYPES } from '../utils/constants.js';

// Schema for getting pending verifications
export const getVerificationsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
        type: z
            .enum([
                MEDIA_TYPES.ID_PROOF,
                MEDIA_TYPES.ADDRESS_PROOF,
                MEDIA_TYPES.INCOME_PROOF,
                MEDIA_TYPES.EDUCATION_CERTIFICATE,
            ])
            .optional(),
    }),
});

// Schema for mediaId param
export const mediaIdParamSchema = z.object({
    params: z.object({
        mediaId: z.coerce
            .number({ invalid_type_error: 'Media ID must be a number' })
            .int()
            .positive('Media ID must be a positive integer'),
    }),
});

// Schema for reject/resubmit with reason
export const rejectVerificationSchema = z.object({
    params: z.object({
        mediaId: z.coerce
            .number({ invalid_type_error: 'Media ID must be a number' })
            .int()
            .positive('Media ID must be a positive integer'),
    }),
    body: z.object({
        reason: z
            .string({ required_error: 'Reason is required' })
            .min(10, 'Reason must be at least 10 characters')
            .max(500, 'Reason must be at most 500 characters'),
    }),
});
