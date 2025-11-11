import { z } from 'zod';

// Schema for routes with a :notificationId parameter
export const notificationIdParamSchema = z.object({
  params: z.object({
    notificationId: z.coerce // .coerce() automatically converts the string param to a number
      .number({ invalid_type_error: 'Notification ID must be a number' })
      .int()
      .positive('Notification ID must be a positive integer'),
  }),
});

// Schema for the GET /api/notifications route (pagination)
export const getNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});