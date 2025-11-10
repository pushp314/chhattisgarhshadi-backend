import { PAGINATION } from './constants.js';

/**
 * Calculate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
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
 * @param {Object} query - Request query parameters
 * @returns {Object} Pagination parameters
 */
export const getPaginationParams = (query) => {
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Generate random OTP
 * @param {number} length - OTP length
 * @returns {string} OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
export const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitizedName}_${timestamp}_${random}.${extension}`;
};

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date
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
 * @param {Date|string} dob - Date of birth
 * @returns {number} Age in years
 */
export const calculateAge = (dob) => {
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
 * @param {string} mimetype - File mimetype
 * @returns {string} File extension
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
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Chunked array
 */
export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Remove undefined and null values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
export const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  );
};

/**
 * Generate S3 object key
 * @param {string} folder - S3 folder
 * @param {string} filename - Filename
 * @returns {string} S3 object key
 */
export const generateS3Key = (folder, filename) => {
  return `${folder}/${filename}`;
};

/**
 * Parse JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload
 */
export const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Convert height from cm to feet/inches
 * @param {number} cm - Height in centimeters
 * @returns {Object} Height in feet and inches
 */
export const cmToFeetInches = (cm) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

/**
 * Mask email address
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
export const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.substring(0, 2) + '***' + username.substring(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask phone number
 * @param {string} phone - Phone number to mask
 * @returns {string} Masked phone
 */
export const maskPhone = (phone) => {
  return phone.substring(0, 2) + '******' + phone.substring(phone.length - 2);
};
