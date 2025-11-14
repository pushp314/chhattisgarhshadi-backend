import { S3Client } from '@aws-sdk/client-s3';
import { config } from './config.js';
import { logger } from './logger.js';

/**
 * Check if S3 is configured
 * @returns {boolean}
 */
export const isS3Configured = () => {
  return !!(
    config.AWS_ACCESS_KEY_ID &&
    config.AWS_SECRET_ACCESS_KEY &&
    (config.AWS_S3_BUCKET_NAME || config.AWS_S3_BUCKET)
  );
};

/**
 * Initialize AWS S3 Client (only if configured)
 */
export const s3Client = isS3Configured()
  ? new S3Client({
      region: config.AWS_S3_REGION || config.AWS_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

if (isS3Configured()) {
  logger.info('AWS S3 Client initialized successfully');
} else {
  logger.warn('AWS S3 is not configured. File upload features will be limited.');
}

/**
 * Get S3 bucket name from config
 * @returns {string}
 */
export const getBucketName = () => config.AWS_S3_BUCKET_NAME || config.AWS_S3_BUCKET;

/**
 * Get S3 region from config
 * @returns {string}
 */
export const getRegion = () => config.AWS_S3_REGION || config.AWS_REGION;