// Cloudflare R2 Storage Configuration
import { S3Client } from '@aws-sdk/client-s3';
import { logger } from './logger.js';

/**
 * Check if R2 is configured
 * @returns {boolean}
 */
export const isR2Configured = () => {
    return !!(
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME &&
        process.env.R2_ENDPOINT
    );
};

/**
 * Initialize Cloudflare R2 Client (S3-compatible API)
 */
export const r2Client = isR2Configured()
    ? new S3Client({
        region: process.env.R2_REGION || 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    })
    : null;

if (isR2Configured()) {
    logger.info('Cloudflare R2 Client initialized successfully');
} else {
    logger.warn('Cloudflare R2 is not configured. File upload features will be limited.');
}

/**
 * Get Bucket Name
 * @returns {string}
 */
export const getBucketName = () => process.env.R2_BUCKET_NAME;

/**
 * Get Region
 * @returns {string}
 */
export const getRegion = () => process.env.R2_REGION || 'auto';

/**
 * Get Public URL base
 * @returns {string|null}
 */
export const getPublicUrl = () => process.env.R2_PUBLIC_URL || null;

// Backward compatibility exports (deprecated, use r2-prefixed versions)
export const s3Client = r2Client;
export const isS3Configured = isR2Configured;
