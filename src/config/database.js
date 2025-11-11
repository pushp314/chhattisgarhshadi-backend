import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
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