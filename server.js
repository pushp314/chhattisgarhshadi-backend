import http from 'http';
import app from './src/app.js';
import { config } from './src/config/config.js';
import { logger } from './src/config/logger.js';
import { initializeSocket } from './src/socket/index.js';
import { initializeFirebase } from './src/config/firebase.js';
import prisma from './src/config/database.js';

const PORT = config.PORT || 8080;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer, config);

// Make io accessible to routes
app.set('io', io);

/**
 * Test database connection
 */
const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Initialize Firebase (optional)
    initializeFirebase();

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Close HTTP server
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Disconnect from database
      await prisma.$disconnect();
      logger.info('Database disconnected');

      // Close Socket.io connections
      io.close(() => {
        logger.info('Socket.io connections closed');
      });

      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export { io, httpServer };
