import { S3Client } from '@aws-sdk/client-s3';
import { config } from './config.js';
import { logger } from './logger.js';

/**
 * Initialize AWS S3 Client
 */
export const s3Client = new S3Client({
  region: config.AWS_S3_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

logger.info('AWS S3 Client initialized successfully');

/**
 * Get S3 bucket name from config
 * @returns {string}
 */
export const getBucketName = () => config.AWS_S3_BUCKET_NAME;

/**
 * Get S3 region from config
 * @returns {string}
 */
export const getRegion = () => config.AWS_S3_REGION;