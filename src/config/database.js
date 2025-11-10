import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient is created
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });
};

// Declare global prisma variable
const globalForPrisma = globalThis;

// Create or reuse prisma instance
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Log database queries in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

// Store prisma instance in global scope in development to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

logger.info('Prisma Client initialized successfully');

export default prisma;
