/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Indian)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate date of birth (must be 18+ years old)
 * @param {Date|string} dob - Date of birth
 * @returns {Object} Validation result with isValid and message
 */
export const isValidDOB = (dob) => {
  const dobDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())
    ? age - 1
    : age;
  
  if (actualAge < 18) {
    return { isValid: false, message: 'User must be at least 18 years old' };
  }
  
  if (actualAge > 100) {
    return { isValid: false, message: 'Invalid date of birth' };
  }
  
  return { isValid: true, message: 'Valid date of birth' };
};

/**
 * Validate height in cm
 * @param {number} height - Height in cm
 * @returns {Object} Validation result
 */
export const isValidHeight = (height) => {
  if (height < 100 || height > 250) {
    return { isValid: false, message: 'Height must be between 100cm and 250cm' };
  }
  return { isValid: true, message: 'Valid height' };
};

/**
 * Validate amount
 * @param {number} amount - Amount to validate
 * @returns {Object} Validation result
 */
export const isValidAmount = (amount) => {
  if (amount <= 0) {
    return { isValid: false, message: 'Amount must be greater than 0' };
  }
  return { isValid: true, message: 'Valid amount' };
};

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate file type for uploads
 * @param {string} mimetype - File mimetype
 * @param {string[]} allowedTypes - Allowed mimetypes
 * @returns {boolean}
 */
export const isValidFileType = (mimetype, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Maximum size in MB
 * @returns {Object} Validation result
 */
export const isValidFileSize = (size, maxSize = 5) => {
  const maxSizeBytes = maxSize * 1024 * 1024;
  if (size > maxSizeBytes) {
    return { isValid: false, message: `File size must be less than ${maxSize}MB` };
  }
  return { isValid: true, message: 'Valid file size' };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if string contains only alphanumeric characters
 * @param {string} str - String to check
 * @returns {boolean}
 */
export const isAlphanumeric = (str) => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * Validate CUID format
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
export const isValidCUID = (id) => {
  return /^c[a-z0-9]{24}$/.test(id);
};
