import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { logger } from '../config/logger.js';

/**
 * Generate JWT Access Token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, config.JWT_ACCESS_SECRET || config.ACCESS_TOKEN_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRY || config.ACCESS_TOKEN_EXPIRY,
    });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

/**
 * Generate JWT Refresh Token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET || config.REFRESH_TOKEN_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRY || config.REFRESH_TOKEN_EXPIRY,
    });
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Verify JWT Access Token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET || config.ACCESS_TOKEN_SECRET);
  } catch (error) {
    logger.error('Error verifying access token:', error);
    throw error;
  }
};

/**
 * Verify JWT Refresh Token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET || config.REFRESH_TOKEN_SECRET);
  } catch (error) {
    logger.error('Error verifying refresh token:', error);
    throw error;
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Generate token pair (access and refresh)
 * @param {Object} payload - Token payload
 * @returns {Object} Object containing access and refresh tokens
 */
export const generateTokenPair = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
