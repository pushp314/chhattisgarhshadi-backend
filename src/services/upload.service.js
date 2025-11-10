import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getBucketName } from '../config/aws.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { generateUniqueFilename, generateS3Key } from '../utils/helpers.js';
import { logger } from '../config/logger.js';
import sharp from 'sharp';

/**
 * Upload file to S3
 * @param {Object} file - File object from multer
 * @param {string} folder - S3 folder name
 * @returns {Promise<Object>}
 */
export const uploadToS3 = async (file, folder = 'uploads') => {
  try {
    const filename = generateUniqueFilename(file.originalname);
    const key = generateS3Key(folder, filename);

    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const url = `https://${getBucketName()}.s3.amazonaws.com/${key}`;

    logger.info(`File uploaded to S3: ${key}`);

    return {
      url,
      key,
      filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    logger.error('Error in uploadToS3:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to upload file');
  }
};

/**
 * Upload multiple files to S3
 * @param {Array} files - Array of file objects
 * @param {string} folder - S3 folder name
 * @returns {Promise<Array>}
 */
export const uploadMultipleToS3 = async (files, folder = 'uploads') => {
  try {
    const uploadPromises = files.map(file => uploadToS3(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Error in uploadMultipleToS3:', error);
    throw error;
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    });

    await s3Client.send(command);

    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('Error in deleteFromS3:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to delete file');
  }
};

/**
 * Generate presigned URL for private files
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry in seconds
 * @returns {Promise<string>}
 */
export const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
  } catch (error) {
    logger.error('Error in getPresignedUrl:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to generate presigned URL');
  }
};

/**
 * Process and upload image with thumbnail
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
    const mainImage = await uploadToS3(mainImageFile, folder);

    // Upload thumbnail
    const thumbnailFile = {
      ...file,
      buffer: thumbnail,
      originalname: `thumb_${file.originalname.replace(/\.[^/.]+$/, '.jpg')}`,
      mimetype: 'image/jpeg',
    };
    const thumbnailImage = await uploadToS3(thumbnailFile, `${folder}/thumbnails`);

    return {
      original: mainImage,
      thumbnail: thumbnailImage,
    };
  } catch (error) {
    logger.error('Error in processAndUploadImage:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to process and upload image');
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - S3 URL
 * @returns {string} S3 key
 */
export const extractKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    logger.error('Error extracting key from URL:', error);
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid S3 URL');
  }
};

export const uploadService = {
  uploadToS3,
  uploadMultipleToS3,
  deleteFromS3,
  getPresignedUrl,
  processAndUploadImage,
  extractKeyFromUrl,
};
