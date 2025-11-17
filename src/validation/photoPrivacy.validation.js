import { z } from 'zod';
import { 
  PHOTO_VISIBILITY, 
  WATERMARK_POSITION, 
  BLUR_LEVEL 
} from '../utils/constants.js';

// Schema for the mediaId parameter
export const mediaIdParamSchema = z.object({
  params: z.object({
    mediaId: z.coerce
      .number({ invalid_type_error: 'Media ID must be a number' })
      .int()
      .positive('Media ID must be a positive integer'),
  }),
});

// Schema for updating photo privacy settings
export const updatePhotoPrivacySchema = z.object({
  body: z.object({
    visibility: z.nativeEnum(PHOTO_VISIBILITY).optional(),
    enableWatermark: z.boolean().optional(),
    watermarkText: z.string().max(100).optional().nullable(),
    watermarkPosition: z.nativeEnum(WATERMARK_POSITION).optional(),
    preventScreenshots: z.boolean().optional(),
    disableRightClick: z.boolean().optional(),
    blurForNonPremium: z.boolean().optional(),
    blurLevel: z.nativeEnum(BLUR_LEVEL).optional(),
    allowDownload: z.boolean().optional(),
    allowViewRequests: z.boolean().optional(),
    autoApprovePremium: z.boolean().optional(),
    autoApproveVerified: z.boolean().optional(),
  }).strict(),
  
  params: mediaIdParamSchema.shape.params, // Re-use the ID schema
});