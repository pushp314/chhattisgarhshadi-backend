import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? [
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
          { level: 'query', emit: 'event' }, // Log slow queries in dev
        ]
      : [
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pooling (optimized for Neon PostgreSQL)
    __internal: {
      engine: {
        connection_limit: process.env.DATABASE_CONNECTION_LIMIT || 10,
      },
    },
  });
};

// Singleton pattern
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Event listeners
prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning:', e);
});

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 1000) { // Log queries taking > 1 second
      logger.warn(`Slow query detected (${e.duration}ms):`, e.query);
    }
  });
}

// Connection test
prisma.$connect()
  .then(() => {
    logger.info('Prisma Client initialized successfully');
  })
  .catch((err) => {
    logger.error('Failed to connect Prisma Client:', err);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;