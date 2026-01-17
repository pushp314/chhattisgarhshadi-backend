// Cloudflare R2 Config
import { S3Client } from '@aws-sdk/client-s3';
import { config } from './config.js';
import { logger } from './logger.js';

/**
 * Check if R2 is configured
 * @returns {boolean}
 */
export const isS3Configured = () => {
  return !!(
    (process.env.R2_ACCESS_KEY_ID || config.AWS_ACCESS_KEY_ID) &&
    (process.env.R2_SECRET_ACCESS_KEY || config.AWS_SECRET_ACCESS_KEY) &&
    (process.env.R2_BUCKET_NAME || config.AWS_S3_BUCKET_NAME)
  );
};

/**
 * Initialize Cloudflare R2 Client (via S3 SDK)
 */
export const s3Client = isS3Configured()
  ? new S3Client({
    region: process.env.R2_REGION || config.AWS_S3_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT || process.env.AWS_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || config.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || config.AWS_SECRET_ACCESS_KEY,
    },
  })
  : null;

if (isS3Configured()) {
  logger.info('Cloudflare R2 Client initialized successfully');
} else {
  logger.warn('Cloudflare R2 is not configured. File upload features will be limited.');
}

/**
 * Get Bucket Name
 * @returns {string}
 */
export const getBucketName = () => process.env.R2_BUCKET_NAME || config.AWS_S3_BUCKET_NAME;

/**
 * Get Region
 * @returns {string}
 */
export const getRegion = () => process.env.R2_REGION || config.AWS_S3_REGION || 'auto';