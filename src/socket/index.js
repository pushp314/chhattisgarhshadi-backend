import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../config/logger.js';
import { SOCKET_EVENTS } from '../utils/constants.js';
import { setupMessageHandlers } from './handlers/message.handler.js';
import { setupNotificationHandlers } from './handlers/notification.handler.js';

// Store online users
const onlineUsers = new Map();

/**
 * Initialize Socket.io server
 * @param {Object} httpServer - HTTP server instance
 * @param {Object} config - Configuration object
 * @returns {Object} Socket.io server instance
 */
export const initializeSocket = (httpServer, config) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN || config.FRONTEND_URL,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId || decoded.id;
      socket.userEmail = decoded.email;

      logger.info(`Socket authenticated for user: ${socket.userId}`);
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(`User connected: ${socket.userId} (${socket.id})`);

    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);

    // Emit online status to all users
    socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
      userId: socket.userId,
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Setup message handlers
    setupMessageHandlers(io, socket);

    // Setup notification handlers
    setupNotificationHandlers(io, socket);

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`User disconnected: ${socket.userId} (${socket.id})`);

      // Remove user from online users
      onlineUsers.delete(socket.userId);

      // Emit offline status to all users
      socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
        userId: socket.userId,
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  logger.info('Socket.io server initialized successfully');

  return io;
};

/**
 * Get socket ID for a user
 * @param {string} userId - User ID
 * @returns {string|null} Socket ID
 */
export const getSocketId = (userId) => {
  return onlineUsers.get(userId) || null;
};

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

/**
 * Get all online users
 * @returns {Array} Array of online user IDs
 */
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

/**
 * Emit event to specific user
 * @param {Object} io - Socket.io instance
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToUser = (io, userId, event, data) => {
  const socketId = getSocketId(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

/**
 * Emit event to user's room
 * @param {Object} io - Socket.io instance
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToUserRoom = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};
