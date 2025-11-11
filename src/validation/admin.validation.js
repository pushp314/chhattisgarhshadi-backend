import { z } from 'zod';
import { UserRole } from '@prisma/client'; // Import enum from Prisma

// Schema for routes with pagination
export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    // You can add other shared query params like 'search' here
  }),
});

// Schema for "recent items" routes
export const recentQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
  }),
});

// Schema for routes with a :userId param
export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.coerce
      .number({ invalid_type_error: 'User ID must be a number' })
      .int()
      .positive('User ID must be a positive integer'),
  }),
});

// Schema for updating a user's role
export const updateUserRoleSchema = z.object({
  params: z.object({
    userId: z.coerce
      .number({ invalid_type_error: 'User ID must be a number' })
      .int()
      .positive('User ID must be a positive integer'),
  }),
  body: z.object({
    role: z.nativeEnum(UserRole, {
      required_error: 'A valid role is required',
    }),
  }),
});