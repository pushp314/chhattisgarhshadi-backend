import { z } from 'zod';
import { PHOTO_REQUEST_STATUS } from '../utils/constants.js';

// Schema for creating a new photo view request
export const createPhotoRequestSchema = z.object({
  body: z.object({
    photoId: z.coerce
      .number({ invalid_type_error: 'photoId must be a number' })
      .int()
      .positive('photoId must be a positive integer'),
    
    message: z.string().max(500).optional(),
  }),
});

// Schema for the :id URL parameter (request ID)
export const photoRequestIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'Request ID must be a number' })
      .int()
      .positive('Request ID must be a positive integer'),
  }),
});

// Schema for responding to a photo view request
export const respondPhotoRequestSchema = z.object({
  body: z.object({
    status: z.enum([PHOTO_REQUEST_STATUS.APPROVED, PHOTO_REQUEST_STATUS.REJECTED], {
      required_error: 'Status must be APPROVED or REJECTED',
    }),
  }),
  params: photoRequestIdParamSchema.shape.params, // Re-use the ID schema
});


// Schema for paginating request lists
export const getPhotoRequestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(PHOTO_REQUEST_STATUS).optional(),
  }),
});