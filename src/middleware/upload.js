import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { isValidFileType } from '../utils/validators.js';

// Configure memory storage for multer
const storage = multer.memoryStorage();

/**
 * File filter function
 * @param {Array} allowedTypes - Allowed MIME types
 * @returns {Function} Multer file filter
 */
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (isValidFileType(file.mimetype, allowedTypes)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        ),
        false
      );
    }
  };
};

/**
 * Create multer upload instance
 * @param {Object} options - Upload options
 * @returns {Object} Multer instance
 */
const createUploader = (options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize = 5, // MB
  } = options;

  return multer({
    storage,
    fileFilter: createFileFilter(allowedTypes),
    limits: {
      fileSize: maxSize * 1024 * 1024, // Convert to bytes
    },
  });
};

/**
 * Middleware for profile photo upload
 */
export const uploadProfilePhoto = createUploader({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5,
}).single('photo'); // Field name 'photo'

/**
 * Middleware for multiple profile photos
 */
export const uploadProfilePhotos = createUploader({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5,
}).array('photos', 6); // Field name 'photos', max 6 files

/**
 * Middleware for document upload (ID proof, etc.)
 */
export const uploadDocument = createUploader({
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  maxSize: 10,
}).single('document'); // Field name 'document'

/**
 * Error handler for multer errors
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'File size too large.'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Too many files.'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Unexpected file field.'));
    }
  }
  next(err);
};