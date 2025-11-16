import { z } from 'zod';
// We no longer need to import OCCUPATION_TYPE
// import { OCCUPATION_TYPE } from '../utils/constants.js';

// Schema for the occupation ID parameter
export const occupationIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'Occupation ID must be a number' })
      .int()
      .positive('Occupation ID must be a positive integer'),
  }),
});

// Schema for creating a new occupation entry
export const createOccupationSchema = z.object({
  body: z.object({
    companyName: z.string({
      required_error: 'Company name is required',
    }).min(2, 'Company name must be at least 2 characters').max(200),
    
    designation: z.string({
      required_error: 'Designation is required',
    }).min(2, 'Designation must be at least 2 characters').max(100),
    
    // FIX: Changed from z.nativeEnum to z.string()
    employmentType: z.string({
      required_error: 'Employment type is required',
    }).max(50),
    
    industry: z.string().max(100).optional(),
    annualIncome: z.string().max(50).optional(),
    startDate: z.string().datetime('Invalid start date. Must be ISO 8601').optional(),
    endDate: z.string().datetime('Invalid end date. Must be ISO 8601').optional(),
    isCurrent: z.boolean().optional().default(true),
    location: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
  }),
});

// Schema for updating an existing occupation entry
export const updateOccupationSchema = z.object({
  body: z.object({
    companyName: z.string().min(2).max(200).optional(),
    designation: z.string().min(2).max(100).optional(),

    // FIX: Changed from z.nativeEnum to z.string()
    employmentType: z.string().max(50).optional(),

    industry: z.string().max(100).optional(),
    annualIncome: z.string().max(50).optional(),
    startDate: z.string().datetime().optional().nullable(), // Allow null to clear date
    endDate: z.string().datetime().optional().nullable(), // Allow null to clear date
    isCurrent: z.boolean().optional(),
    location: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
  }).strict(), // .strict() ensures no other fields can be passed
  
  params: occupationIdParamSchema.shape.params, // Re-use the ID schema
});