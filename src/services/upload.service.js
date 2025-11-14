import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getBucketName, isS3Configured } from '../config/aws.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { generateUniqueFilename, generateS3Key } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
import sharp from 'sharp';

/**
 * Upload file to S3
 * @param {Object} file - File object from multer
 * @param {string} folder - S3 folder name
 * @param {boolean} isPublic - Whether the file should be publicly readable
 * @returns {Promise<Object>}
 */
export const uploadToS3 = async (
  file,
  folder = 'uploads',
  isPublic = false
) => {
  try {
    // Check if S3 is configured
    if (!isS3Configured()) {
      throw new ApiError(
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        'S3 storage is not configured. Please contact administrator.'
      );
    }
    const filename = generateUniqueFilename(file.originalname);
    const key = generateS3Key(folder, filename);

    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // CRITICAL FIX: Only set ACL if it's explicitly public
      ...(isPublic && { ACL: 'public-read' }),
    });

    await s3Client.send(command);

    const s3Url = `https://${getBucketName()}.s3.amazonaws.com/${key}`;

    logger.info(`File uploaded to S3: ${key} (public: ${isPublic})`);

    return {
      key, // Always return the key
      url: isPublic ? s3Url : null, // Only return public URL if public
      filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    logger.error('Error in uploadToS3:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to upload file'
    );
  }
};

/**
 * Process and upload image with thumbnail (Public)
 * @param {Object} file - File object from multer
 * @param {string} folder - S3 folder name
 * @returns {Promise<Object>}
 */
export const processAndUploadImage = async (file, folder = 'photos') => {
  try {
    // Process main image
    const processedImage = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Process thumbnail
    const thumbnail = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload main image
    const mainImageFile = {
      ...file,
      buffer: processedImage,
      originalname: file.originalname.replace(/\.[^/.]+$/, '.jpg'),
      mimetype: 'image/jpeg',
    };
    // Profile photos are public
    const mainImage = await uploadToS3(mainImageFile, folder, true);

    // Upload thumbnail
    const thumbnailFile = {
      ...file,
      buffer: thumbnail,
      originalname: `thumb_${file.originalname.replace(
        /\.[^/.]+$/,
        '.jpg'
      )}`,
      mimetype: 'image/jpeg',
    };
    // Thumbnails are also public
    const thumbnailImage = await uploadToS3(
      thumbnailFile,
      `${folder}/thumbnails`,
      true
    );

    return {
      original: mainImage,
      thumbnail: thumbnailImage,
    };
  } catch (error) {
    logger.error('Error in processAndUploadImage:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to process and upload image'
    );
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    });

    await s3Client.send(command);

    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('Error in deleteFile:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete file'
    );
  }
};

/**
 * Generate presigned URL for private files
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry in seconds
 * @returns {Promise<string>}
 */
export const getPresignedUrl = async (key, expiresIn = 3600) => {
  if (!key) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
  } catch (error) {
    logger.error('Error in getPresignedUrl:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to generate presigned URL'
    );
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - S3 URL
 * @returns {string} S3 key
 */
export const extractKeyFromUrl = (url) => {
  if (!url) return null;
  try {
    // Handle both full URLs and simple keys
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      return decodeURIComponent(urlObj.pathname.substring(1)); // Remove leading slash
    }
    // Assume it's already a key if no "http"
    return url;
  } catch (error) {
    logger.error('Error extracting key from URL:', error);
    return null; // Return null instead of throwing
  }
};

export const uploadService = {
  uploadToS3,
  processAndUploadImage,
  deleteFile,
  getPresignedUrl,
  extractKeyFromUrl,
};