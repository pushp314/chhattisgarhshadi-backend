import winston from 'winston';
import { config } from './config.js';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create console format for better readability in development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: config.NODE_ENV === 'production' ? logFormat : consoleFormat,
  }),
  // Error log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: logFormat,
  }),
  // Combined log file
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: logFormat,
  }),
];

// Create logger instance
export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create a stream for Morgan HTTP logger
export const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};
