import { z } from 'zod';
import { AGENT_STATUS, LANGUAGE } from '../utils/constants.js';

// Regex for an Indian phone number (10 digits, starting with 6, 7, 8, or 9)
const phoneRegex = /^[6-9]\d{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const agentBodyBase = {
  agentCode: z.string().min(3, 'Agent code is required').max(20),
  agentName: z.string().min(3, 'Agent name is required').max(200),
  
  contactPerson: z.string().max(100).optional().nullable(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional().nullable(),
  email: z.string().email('Invalid email address').max(255).optional().nullable(),
  alternatePhone: z.string().regex(phoneRegex, 'Invalid alternate phone').optional().nullable(),
  
  addressLine1: z.string().max(255).optional().nullable(),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional().nullable(),

  businessName: z.string().max(200).optional().nullable(),
  businessType: z.string().max(50).optional().nullable(),
  gstNumber: z.string().regex(gstRegex, 'Invalid GST number').optional().nullable(),
  panNumber: z.string().regex(panRegex, 'Invalid PAN number').optional().nullable(),

  commissionType: z.string().max(20).optional(),
  commissionValue: z.coerce.number().optional(),
  commissionOn: z.string().max(30).optional(),

  status: z.nativeEnum(AGENT_STATUS).optional(),
  
  bankName: z.string().max(100).optional().nullable(),
  accountHolderName: z.string().max(200).optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  ifscCode: z.string().regex(ifscRegex, 'Invalid IFSC code').optional().nullable(),
  branchName: z.string().max(100).optional().nullable(),
  upiId: z.string().max(100).optional().nullable(),

  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  socialMediaLinks: z.string().optional().nullable(), // Will be stored as JSON string
  preferredLanguage: z.nativeEnum(LANGUAGE).optional(),
};

export const createAgentSchema = z.object({
  body: z.object(agentBodyBase),
});

export const updateAgentSchema = z.object({
  body: z.object({
    agentCode: z.string().min(3).max(20).optional(),
    agentName: z.string().min(3).max(200).optional(),
    // Make all other fields optional
    ...Object.keys(agentBodyBase)
      .filter(key => !['agentCode', 'agentName'].includes(key))
      .reduce((obj, key) => {
        obj[key] = agentBodyBase[key];
        return obj;
      }, {})
  }).strict(),
  params: z.object({
    agentId: z.coerce.number().int().positive(),
  }),
});

export const agentIdParamSchema = z.object({
  params: z.object({
    agentId: z.coerce.number().int().positive(),
  }),
});

export const getAgentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(AGENT_STATUS).optional(),
    district: z.string().optional(),
    search: z.string().optional(),
  }),
});