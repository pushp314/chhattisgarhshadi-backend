/**
 * Validate file type for uploads (used in upload.js middleware)
 * @param {string} mimetype - File mimetype
 * @param {string[]} allowedTypes - Allowed mimetypes
 * @returns {boolean}
 */
export const isValidFileType = (
  mimetype,
  allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf',
  ]
) => {
  if (!mimetype) return false;
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file size (used in upload.js middleware)
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Maximum size in MB
 * @returns {Object} Validation result
 */
export const isValidFileSize = (size, maxSize = 5) => {
  const maxSizeBytes = maxSize * 1024 * 1024;
  if (size > maxSizeBytes) {
    return {
      isValid: false,
      message: `File size must be less than ${maxSize}MB`,
    };
  }
  return { isValid: true, message: 'Valid file size' };
};

/*
  NOTE: All other validation helpers (isValidEmail, isValidDOB, etc.)
  have been removed. This logic belongs in your
  'src/validations/' Zod schemas, which is a more secure and
  maintainable pattern.
*/