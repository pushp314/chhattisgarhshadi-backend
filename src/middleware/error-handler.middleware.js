import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { config } from '../config/config.js';
import { logger } from '../config/logger.js';
import { HTTP_STATUS } from '../utils/constants.js';

const { JsonWebTokenError, TokenExpiredError } = jwt;

/**
 * Comprehensive error handling middleware.
 * Catches errors from asyncHandler, validation, prisma, and jwt.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';
  let errors = [];

  // 1. Handle our custom ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  }
  // 2. Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY; // 422 is more semantic for validation
    message = 'Validation failed';
    errors = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));
  }
  // 3. Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = HTTP_STATUS.CONFLICT; // 409
        message = `This ${err.meta?.target?.join(', ')} is already in use.`;
        break;
      case 'P2025': // Record not found
        statusCode = HTTP_STATUS.NOT_FOUND; // 404
        message = 'The requested resource was not found.';
        break;
      default:
        statusCode = HTTP_STATUS.BAD_REQUEST; // 400
        message = 'Database request error.';
        logger.warn(`Prisma Error ${err.code}: ${err.message}`);
        break;
    }
  }
  // 4. Handle JWT errors
  else if (err instanceof TokenExpiredError) {
    statusCode = HTTP_STATUS.UNAUTHORIZED; // 401
    message = 'Your session has expired. Please log in again.';
  } else if (err instanceof JsonWebTokenError) {
    statusCode = HTTP_STATUS.UNAUTHORIZED; // 401
    message = 'Invalid session token. Please log in again.';
  }
  // 5. Handle other generic errors
  else {
    statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    message = err.message || 'Internal Server Error';
  }

  // Log the error
  const logMessage = `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;
  logger.error(logMessage, {
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    errors: errors.length > 0 ? errors : undefined,
    // Avoid logging sensitive data from req.body
  });

  // Prepare the response
  const response = {
    ...new ApiResponse(statusCode, null, message),
    // Only include errors array if it has content
    ...(errors.length > 0 && { errors }),
    // Only include stack in development
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Send the error response
  res.status(statusCode).json(response);
};