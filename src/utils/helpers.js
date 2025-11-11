import { PAGINATION } from './constants.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';

/**
 * Calculate pagination metadata
 */
export const getPaginationMetadata = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
  };
};

/**
 * Get pagination parameters from query
 */
export const getPaginationParams = (query) => {
  const page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Generate secure random OTP
 */
export const generateOTP = (length = 6) => {
  // CRITICAL FIX: Use crypto.randomInt for a cryptographically secure random number
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  // FIX: Use crypto for a more unique random number
  const random = crypto.randomInt(10000, 99999);
  const extension = originalName.split('.').pop() || 'tmp';
  const nameWithoutExt =
    originalName.split('.').slice(0, -1).join('.') || 'file';
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9_.-]/g, '_');

  return `${sanitizedName}_${timestamp}_${random}.${extension}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dob) => {
  if (!dob) return 0;
  const dobDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get file extension from mimetype
 */
export const getExtensionFromMimetype = (mimetype) => {
  const mimetypeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  return mimetypeMap[mimetype] || 'bin';
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Chunk array into smaller arrays
 */
export const chunkArray = (array, size) => {
  if (!Array.isArray(array) || size <= 0) {
    return [];
  }
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Remove undefined and null values from object
 */
export const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  );
};

/**
 * Generate S3 object key
 */
export const generateS3Key = (folder, filename) => {
  return `${folder}/${filename}`;
};

/**
 * Parse JWT token without verification
 */
export const parseJWT = (token) => {
  try {
    // FIX: Use the library's built-in decode function
    return jwt.decode(token);
  } catch (e) {
    logger.error('Error decoding JWT:', e.message);
    return null;
  }
};

/**
 * Convert height from cm to feet/inches
 */
export const cmToFeetInches = (cm) => {
  if (typeof cm !== 'number' || cm <= 0) {
    return { feet: 0, inches: 0 };
  }
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

/**
 * Mask email address
 */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) {
    return '***';
  }
  const [username, domain] = email.split('@');
  const maskedUsername =
    username.length > 2
      ? username.substring(0, 2) + '***' + username.substring(username.length - 1)
      : '***';
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask phone number
 */
export const maskPhone = (phone) => {
  if (!phone || phone.length < 4) {
    return '******';
  }
  return phone.substring(0, 2) + '******' + phone.substring(phone.length - 2);
};