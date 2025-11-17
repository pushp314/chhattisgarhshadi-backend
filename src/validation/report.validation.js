import { z } from 'zod';
import { REPORT_REASON } from '../utils/constants.js';

// Schema for creating a new report
export const createReportSchema = z.object({
  body: z.object({
    reportedUserId: z.coerce
      .number({ invalid_type_error: 'reportedUserId must be a number' })
      .int()
      .positive('reportedUserId must be a positive integer'),
    
    reason: z.nativeEnum(REPORT_REASON, {
      required_error: 'A valid reason is required for the report',
    }),
    
    description: z.string({
      required_error: 'A description is required',
    }).min(10, 'Description must be at least 10 characters long').max(1000),
    
    // 'evidence' is a JSON string of URLs. 
    // We'll trust the client to format this, or you can add a file upload link later.
    evidence: z.string().optional(), 
  }),
});