/**
 * User Roles
 */
export const USER_ROLES = {
  USER: 'USER',
  PREMIUM_USER: 'PREMIUM_USER',
  ADMIN: 'ADMIN',
};

/**
 * Gender Options
 */
export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
};

/**
 * Marital Status Options
 */
export const MARITAL_STATUS = {
  SINGLE: 'SINGLE',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
};

/**
 * Match Status Options
 */
export const MATCH_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

/**
 * Payment Status Options
 */
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

/**
 * File Upload Types
 */
export const UPLOAD_TYPES = {
  PROFILE_PHOTO: 'profile_photo',
  ID_PROOF: 'id_proof',
  DOCUMENT: 'document',
};

/**
 * Allowed Image Mimetypes
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Allowed Document Mimetypes
 */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

/**
 * Maximum File Sizes (in MB)
 */
export const MAX_FILE_SIZES = {
  IMAGE: 5,
  DOCUMENT: 10,
};

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Token Expiry Times
 */
export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
  RESET_PASSWORD: '1h',
  EMAIL_VERIFICATION: '24h',
};

/**
 * Rate Limit Windows
 */
export const RATE_LIMITS = {
  STANDARD: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10,
  },
};

/**
 * Socket Events
 */
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_READ: 'message:read',
  NOTIFICATION_SEND: 'notification:send',
  NOTIFICATION_RECEIVED: 'notification:received',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
};

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  MATCH_REQUEST: 'MATCH_REQUEST',
  MATCH_ACCEPTED: 'MATCH_ACCEPTED',
  MATCH_REJECTED: 'MATCH_REJECTED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  PROFILE_VIEWED: 'PROFILE_VIEWED',
  SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_EXISTS: 'User already exists',
  USER_NOT_FOUND: 'User not found',
  PROFILE_NOT_FOUND: 'Profile not found',
  MATCH_NOT_FOUND: 'Match not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  PAYMENT_FAILED: 'Payment failed',
  UPLOAD_FAILED: 'File upload failed',
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PROFILE_CREATED: 'Profile created successfully',
  MATCH_SENT: 'Match request sent successfully',
  MATCH_ACCEPTED: 'Match request accepted',
  MATCH_REJECTED: 'Match request rejected',
  MESSAGE_SENT: 'Message sent successfully',
  PAYMENT_SUCCESS: 'Payment successful',
  UPLOAD_SUCCESS: 'File uploaded successfully',
};
