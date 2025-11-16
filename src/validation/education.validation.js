import { z } from 'zod';
// We no longer need to import EDUCATION_LEVEL
// import { EDUCATION_LEVEL } from '../utils/constants.js'; 

// Schema for the education ID parameter
export const educationIdParamSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ invalid_type_error: 'Education ID must be a number' })
      .int()
      .positive('Education ID must be a positive integer'),
  }),
});

// Schema for creating a new education entry
export const createEducationSchema = z.object({
  body: z.object({
    // FIX: Changed from z.nativeEnum to z.string() to match schema
    degree: z.string({
      required_error: 'Degree is required',
    }).min(2, 'Degree must be at least 2 characters').max(100),

    institution: z.string({
      required_error: 'Institution name is required',
    }).min(2, 'Institution name must be at least 2 characters'),
    
    field: z.string().max(100).optional(),
    university: z.string().max(200).optional(),
    yearOfPassing: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 5).optional(),
    grade: z.string().max(20).optional(),
    isCurrent: z.boolean().optional().default(false),
  }),
});

// Schema for updating an existing education entry
export const updateEducationSchema = z.object({
  body: z.object({
    // FIX: Changed from z.nativeEnum to z.string()
    degree: z.string().min(2).max(100).optional(), 
    
    institution: z.string().min(2).optional(),
    field: z.string().max(100).optional(),
    university: z.string().max(200).optional(),
    yearOfPassing: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 5).optional(),
    grade: z.string().max(20).optional(),
    isCurrent: z.boolean().optional(),
  }).strict(), // .strict() ensures no other fields can be passed
  
  params: educationIdParamSchema.shape.params, // Re-use the ID schema
});