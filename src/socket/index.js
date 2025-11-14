import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../config/logger.js';
import { SOCKET_EVENTS } from '../utils/constants.js';
import { setupMessageHandlers } from './handlers/message.handler.js';
import { setupNotificationHandlers } from './handlers/notification.handler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Stores mapping of userId to a Set of socket.id
 * This correctly handles multiple connections from a single user.
 */
const onlineUsers = new Map();

let ioInstance = null;

/**
 * Get the singleton Socket.io instance
 * @returns {Server|null}
 */
export const getSocketIoInstance = () => {
  return ioInstance;
};

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
        return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication token required'));
      }

      // FIX: Use `decoded.id` as defined in our jwt.js util
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id; // Use decoded.id
      socket.userEmail = decoded.email;

      if (!socket.userId) {
         return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token payload'));
      }

      logger.info(`Socket authenticating for user: ${socket.userId}`);
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error.message);
      next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication failed'));
    }
  });

  // Connection handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(`User connected: ${socket.userId} (Socket ID: ${socket.id})`);

    // --- Presence Management (FIXED for multiple sockets) ---
    // 1. Add socket to the user's Set
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    const userSockets = onlineUsers.get(socket.userId);
    
    // 2. If this is the first socket for this user, broadcast online status
    if (userSockets.size === 0) {
      socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
        userId: socket.userId,
      });
    }
    userSockets.add(socket.id);

    // 3. Join user's personal room (for targeted emits)
    socket.join(`user:${socket.userId}`);

    // Handle explicit join event from frontend
    socket.on('join', (data) => {
      logger.info(`User ${socket.userId} explicitly joined via 'join' event`);
      // User already in their room, just acknowledge
      socket.emit('joined', { userId: socket.userId, success: true });
    });

    // Setup message handlers
    setupMessageHandlers(io, socket);

    // Setup notification handlers
    setupNotificationHandlers(io, socket);

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`User disconnected: ${socket.userId} (Socket ID: ${socket.id})`);

      // --- Presence Management (FIXED for multiple sockets) ---
      // 1. Remove socket from the user's Set
      const userSockets = onlineUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // 2. If this was the last socket for this user, broadcast offline status
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.userId);
          socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
            userId: socket.userId,
          });
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error.message);
    });
  });

  logger.info('Socket.io server initialized successfully');
  ioInstance = io;
  return io;
};

/**
 * Check if user is online (has at least one active socket)
 * @param {number} userId - User ID
 * @returns {boolean}
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

/**
 * Get all online user IDs
 * @returns {number[]} Array of online user IDs
 */
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

/**
 * [DEPRECATED] This function is unsafe as it only targets one socket.
 * Do not use. Use io.to(`user:${userId}`).emit(...) instead.
 */
// export const emitToUser = (io, userId, event, data) => { ... }
// ^^^ We remove this function entirely to prevent bugs.
// All emits should be done via rooms, which is handled in controllers/handlers.