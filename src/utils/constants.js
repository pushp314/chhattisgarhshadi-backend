/**
 * User Roles
 */
export const USER_ROLES = {
  USER: 'USER',
  PREMIUM_USER: 'PREMIUM_USER',
  ADMIN: 'ADMIN',
};

/**
 * Language Options (Matches Prisma Enum)
 */
export const LANGUAGE = {
  EN: 'EN', // English
  HI: 'HI', // Hindi
  CG: 'CG', // Chhattisgarhi
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
 * Religion Options (Matches Prisma Enum)
 */
export const RELIGION = {
  HINDU: 'HINDU',
  MUSLIM: 'MUSLIM',
  CHRISTIAN: 'CHRISTIAN',
  SIKH: 'SIKH',
  BUDDHIST: 'BUDDHIST',
  JAIN: 'JAIN',
  PARSI: 'PARSI',
  JEWISH: 'JEWISH',
  BAHAI: 'BAHAI',
  NO_RELIGION: 'NO_RELIGION',
  SPIRITUAL: 'SPIRITUAL',
  OTHER: 'OTHER',
};

/**
 * Mother Tongue Options (Matches Prisma Enum)
 */
export const MOTHER_TONGUE = {
  CHHATTISGARHI: 'CHHATTISGARHI',
  HINDI: 'HINDI',
  ENGLISH: 'ENGLISH',
  TAMIL: 'TAMIL',
  TELUGU: 'TELUGU',
  MALAYALAM: 'MALAYALAM',
  KANNADA: 'KANNADA',
  MARATHI: 'MARATHI',
  GUJARATI: 'GUJARATI',
  BENGALI: 'BENGALI',
  PUNJABI: 'PUNJABI',
  URDU: 'URDU',
  ODIA: 'ODIA',
  ASSAMESE: 'ASSAMESE',
  KONKANI: 'KONKANI',
  KASHMIRI: 'KASHMIRI',
  SANSKRIT: 'SANSKRIT',
  SINDHI: 'SINDHI',
  NEPALI: 'NEPALI',
  MANIPURI: 'MANIPURI',
  BODO: 'BODO',
  DOGRI: 'DOGRI',
  MAITHILI: 'MAITHILI',
  SANTALI: 'SANTALI',
  OTHER: 'OTHER',
};

/**
 * Marital Status Options (Matches Prisma Enum)
 */
export const MARITAL_STATUS = {
  NEVER_MARRIED: 'NEVER_MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
  AWAITING_DIVORCE: 'AWAITING_DIVORCE',
  ANNULLED: 'ANNULLED',
};

/**
 * Education Level Options (Matches Prisma Enum)
 * ADDED
 */
export const EDUCATION_LEVEL = {
  HIGH_SCHOOL: 'HIGH_SCHOOL',
  INTERMEDIATE: 'INTERMEDIATE',
  DIPLOMA: 'DIPLOMA',
  BACHELORS: 'BACHELORS',
  MASTERS: 'MASTERS',
  DOCTORATE: 'DOCTORATE',
  POST_DOCTORATE: 'POST_DOCTORATE',
  PROFESSIONAL_DEGREE: 'PROFESSIONAL_DEGREE',
  OTHER: 'OTHER',
};

/**
 * Occupation Type Options (Matches Prisma Enum)
 * ADDED
 */
export const OCCUPATION_TYPE = {
  SALARIED: 'SALARIED',
  BUSINESS: 'BUSINESS',
  PROFESSIONAL: 'PROFESSIONAL',
  SELF_EMPLOYED: 'SELF_EMPLOYED',
  NOT_WORKING: 'NOT_WORKING',
  STUDENT: 'STUDENT',
  RETIRED: 'RETIRED',
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
  JOIN: 'join',
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_READ: 'message:read',
  NOTIFICATION_SEND: 'notification:send',
  NOTIFICATION_RECEIVED: 'notification:received',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  TYPING_START: 'typing:started',
  TYPING_STOP: 'typing:stopped',
};

/**
 * Media Types (Matches Prisma Enum: MediaType)
 */
export const MEDIA_TYPES = {
  PROFILE_PHOTO: 'PROFILE_PHOTO',
  GALLERY_PHOTO: 'GALLERY_PHOTO',
  ID_PROOF: 'ID_PROOF',
  ADDRESS_PROOF: 'ADDRESS_PROOF',
  INCOME_PROOF: 'INCOME_PROOF',
  EDUCATION_CERTIFICATE: 'EDUCATION_CERTIFICATE',
  CHAT_IMAGE: 'CHAT_IMAGE',
  OTHER_DOCUMENT: 'OTHER_DOCUMENT',
};

/**
 * Subscription Status Options
 */
export const SUBSCRIPTION_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
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


/**
 * Report Reasons (Matches Prisma Enum)
 * ADDED
 */
export const REPORT_REASON = {
  FAKE_PROFILE: 'FAKE_PROFILE',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  HARASSMENT: 'HARASSMENT',
  SCAM: 'SCAM',
  SPAM: 'SPAM',
  UNDERAGE: 'UNDERAGE',
  IMPERSONATION: 'IMPERSONATION',
  PRIVACY_VIOLATION: 'PRIVACY_VIOLATION',
  OTHER: 'OTHER',
};


/**
 * Profile Visibility Options
 * ADDED
 */
export const PROFILE_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  REGISTERED: 'REGISTERED',
  MATCHED: 'MATCHED',
  HIDDEN: 'HIDDEN',
};

/**
 * Privacy Level Options (for contact info, etc.)
 * ADDED
 */
export const PRIVACY_LEVEL = {
  PUBLIC: 'PUBLIC',
  REGISTERED: 'REGISTERED',
  MATCHED: 'MATCHED',
  HIDDEN: 'HIDDEN',
};



/**
 * Communication Privacy Options (for receiving requests)
 * ADDED
 */
export const COMMUNICATION_PRIVACY = {
  EVERYONE: 'EVERYONE',
  MATCHED_ONLY: 'MATCHED_ONLY',
  HIDDEN: 'HIDDEN', // You might want a 'nobody' option
};

/**
 * Message Privacy Options
 * ADDED
 */
export const MESSAGE_PRIVACY = {
  EVERYONE: 'EVERYONE',
  MATCHED_ONLY: 'MATCHED_ONLY',
};


/**
 * Photo Visibility Options
 * ADDED
 */
export const PHOTO_VISIBILITY = {
  REGISTERED: 'REGISTERED',
  MATCHED: 'MATCHED',
  HIDDEN: 'HIDDEN',
};

/**
 * Watermark Position Options
 * ADDED
 */
export const WATERMARK_POSITION = {
  BOTTOM_RIGHT: 'BOTTOM_RIGHT',
  CENTER: 'CENTER',
  TOP_LEFT: 'TOP_LEFT',
  // ... add others as needed
};

/**
 * Photo Blur Level Options
 * ADDED
 */
export const BLUR_LEVEL = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};


/**
 * Contact Request Type Options
 * ADDED
 */
export const CONTACT_REQUEST_TYPE = {
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  SOCIAL: 'SOCIAL', // Example, based on schema `showSocialMedia`
};

/**
 * Contact Request Status Options
 * ADDED
 */
export const CONTACT_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};


/**
 * Report Status (Matches Prisma Enum)
 * ADDED
 */
export const REPORT_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
  ESCALATED: 'ESCALATED',
};


/**
 * Photo View Request Status Options
 * ADDED
 */
export const PHOTO_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};


/**
 * Agent Status (Matches Prisma Enum)
 * ADDED
 */
export const AGENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
};


/**
 * Two-Factor Authentication Methods
 * ADDED
 */
export const TWO_FACTOR_METHOD = {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  BOTH: 'BOTH',
};