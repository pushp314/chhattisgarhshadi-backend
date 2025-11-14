import { z } from 'zod';

// Reusable schema for pagination
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.coerce
      .number({ invalid_type_error: 'receiverId must be a number' })
      .int()
      .positive('receiverId must be a positive integer'),
    content: z
      .string({ required_error: 'content is required' })
      .min(1, 'Message content cannot be empty')
      .max(2000, 'Message cannot exceed 2000 characters'),
  }),
});

export const conversationParamsSchema = z.object({
  params: z.object({
    userId: z.coerce
      .number({ invalid_type_error: 'userId must be a number' })
      .int()
      .positive('userId must be a positive integer'),
  }),
});

export const conversationQuerySchema = z.object({
  query: paginationSchema,
});

export const messageIdParamSchema = z.object({
  params: z.object({
    messageId: z.coerce
      .number({ invalid_type_error: 'messageId must be a number' })
      .int()
      .positive('messageId must be a positive integer'),
  }),
});