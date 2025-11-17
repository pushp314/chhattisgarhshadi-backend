import { z } from 'zod';
import { UserRole } from '@prisma/client'; // Import enum from Prisma
// ADDED: Import ReportStatus
import { REPORT_STATUS } from '../utils/constants.js';

// Schema for routes with pagination
export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
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

// --- ADDED FOR REPORTS ---

// Schema for getting reports (with filter)
export const getReportsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(REPORT_STATUS).optional(),
  }),
});

// Schema for report ID param
export const reportIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'Report ID must be a number' })
      .int()
      .positive('Report ID must be a positive integer'),
  }),
});

// Schema for updating a report
export const updateReportSchema = z.object({
  params: reportIdParamSchema.shape.params,
  body: z.object({
    status: z.nativeEnum(REPORT_STATUS, {
      required_error: 'A valid status is required',
    }),
    reviewNote: z.string().optional().nullable(),
    actionTaken: z.string().max(100).optional().nullable(),
  }).strict(),
});