import { z } from 'zod';
import { CONTACT_REQUEST_TYPE, CONTACT_REQUEST_STATUS } from '../utils/constants.js';

// Schema for creating a new contact request
export const createContactRequestSchema = z.object({
  body: z.object({
    profileId: z.coerce
      .number({ invalid_type_error: 'profileId must be a number' })
      .int()
      .positive('profileId must be a positive integer'),
    
    requestType: z.nativeEnum(CONTACT_REQUEST_TYPE, {
      required_error: 'A valid requestType (e.g., PHONE, EMAIL) is required',
    }),
    
    message: z.string().max(500).optional(),
  }),
});

// Schema for the :id URL parameter
export const contactRequestIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'Request ID must be a number' })
      .int()
      .positive('Request ID must be a positive integer'),
  }),
});

// Schema for responding to a contact request
export const respondContactRequestSchema = z.object({
  body: z.object({
    status: z.enum([CONTACT_REQUEST_STATUS.APPROVED, CONTACT_REQUEST_STATUS.REJECTED], {
      required_error: 'Status must be APPROVED or REJECTED',
    }),
  }),
  params: contactRequestIdParamSchema.shape.params, // Re-use the ID schema
});


// Schema for paginating request lists
export const getContactRequestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(CONTACT_REQUEST_STATUS).optional(),
  }),
});