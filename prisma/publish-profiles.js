import prisma from '../src/config/database.js';
import { logger } from '../src/config/logger.js';

/**
 * Publish all existing draft profiles
 */
async function publishAllProfiles() {
    try {
        logger.info('📝 Publishing all draft profiles...');

        const result = await prisma.profile.updateMany({
            where: {
                isPublished: false,
            },
            data: {
                isPublished: true,
                isDraft: false,
                publishedAt: new Date(),
            },
        });

        logger.info(`✅ Published ${result.count} profiles`);

        // Show total published profiles
        const total = await prisma.profile.count({
            where: { isPublished: true }
        });

        logger.info(`📊 Total published profiles: ${total}`);
    } catch (error) {
        logger.error('❌ Error publishing profiles:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

publishAllProfiles()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
