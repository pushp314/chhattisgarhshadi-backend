import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { isValidFileType, isValidFileSize } from '../utils/validators.js';
import { generateUniqueFilename } from '../utils/helpers.js';

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
    maxFiles = 1,
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
 * Middleware for single image upload
 */
export const uploadSingleImage = createUploader({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5,
}).single('image');

/**
 * Middleware for multiple image uploads
 */
export const uploadMultipleImages = createUploader({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5,
}).array('images', 10);

/**
 * Middleware for profile photo upload
 */
export const uploadProfilePhoto = createUploader({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5,
}).single('photo');

/**
 * Middleware for document upload (ID proof, etc.)
 */
export const uploadDocument = createUploader({
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  maxSize: 10,
}).single('document');

/**
 * Middleware for multiple profile photos
 */
export const uploadProfilePhotos = createUploader({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5,
}).array('photos', 6);

/**
 * Error handler for multer errors
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'File size too large',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Too many files',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Unexpected file field',
      });
    }
  }
  next(err);
};

/**
 * Validate uploaded files after multer processing
 */
export const validateUploadedFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);

  if (files.length === 0) {
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'No files uploaded'));
  }

  for (const file of files) {
    const sizeValidation = isValidFileSize(file.size);
    if (!sizeValidation.isValid) {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, sizeValidation.message));
    }
  }

  next();
};
