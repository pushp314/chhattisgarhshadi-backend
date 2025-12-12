/**
 * Profile Boost Service
 * Handles spotlight/boost feature for premium visibility
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

// Boost pricing and duration
const BOOST_PACKAGES = {
    SPOTLIGHT_1HR: {
        id: 'spotlight_1hr',
        name: '1 Hour Spotlight',
        price: 49,
        durationHours: 1,
        multiplier: 5, // 5x visibility
        description: 'Be on top for 1 hour',
    },
    SPOTLIGHT_3HR: {
        id: 'spotlight_3hr',
        name: '3 Hour Spotlight',
        price: 99,
        durationHours: 3,
        multiplier: 5,
        description: 'Be on top for 3 hours',
    },
    BOOST_24HR: {
        id: 'boost_24hr',
        name: '24 Hour Boost',
        price: 149,
        durationHours: 24,
        multiplier: 3, // 3x visibility
        description: 'Boost visibility for 24 hours',
    },
    BOOST_7DAY: {
        id: 'boost_7day',
        name: '7 Day Boost',
        price: 499,
        durationHours: 168, // 7 * 24
        multiplier: 2,
        description: 'Week-long visibility boost',
    },
    HIGHLIGHTER: {
        id: 'highlighter',
        name: 'Profile Highlighter',
        price: 199,
        durationHours: 168, // 7 days
        multiplier: 1,
        isHighlighted: true,
        description: 'Golden border on your profile',
    },
};

/**
 * Activate a boost for user
 * @param {number} userId - User ID
 * @param {string} boostType - SPOTLIGHT_1HR, BOOST_24HR, etc.
 * @param {string} transactionId - Payment transaction ID
 */
export const activateBoost = async (userId, boostType, transactionId) => {
    const boostPackage = BOOST_PACKAGES[boostType];

    if (!boostPackage) {
        throw new Error('Invalid boost package');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + boostPackage.durationHours * 60 * 60 * 1000);

    // Create boost record
    const boost = await prisma.profileBoost.create({
        data: {
            userId,
            boostType,
            multiplier: boostPackage.multiplier,
            isHighlighted: boostPackage.isHighlighted || false,
            price: boostPackage.price,
            transactionId,
            activatedAt: now,
            expiresAt,
            status: 'ACTIVE',
        },
    });

    logger.info(`Boost activated: ${boostType} for user ${userId} until ${expiresAt}`);

    return {
        boost,
        package: boostPackage,
        expiresAt,
    };
};

/**
 * Check if user has active boost
 * @param {number} userId - User ID
 */
export const getActiveBoost = async (userId) => {
    const now = new Date();

    const activeBoost = await prisma.profileBoost.findFirst({
        where: {
            userId,
            status: 'ACTIVE',
            expiresAt: { gt: now },
        },
        orderBy: { multiplier: 'desc' }, // Get highest multiplier boost
    });

    if (!activeBoost) {
        return null;
    }

    const remainingMinutes = Math.round((activeBoost.expiresAt.getTime() - now.getTime()) / 60000);

    return {
        ...activeBoost,
        remainingMinutes,
        remainingHours: Math.ceil(remainingMinutes / 60),
        package: BOOST_PACKAGES[activeBoost.boostType],
    };
};

/**
 * Get boosted profiles for search results
 * Returns user IDs that should be shown first
 */
export const getBoostedProfileIds = async (limit = 10) => {
    const now = new Date();

    const boostedProfiles = await prisma.profileBoost.findMany({
        where: {
            status: 'ACTIVE',
            expiresAt: { gt: now },
        },
        orderBy: [
            { multiplier: 'desc' },
            { activatedAt: 'desc' },
        ],
        take: limit,
        select: { userId: true, multiplier: true, isHighlighted: true },
    });

    return boostedProfiles;
};

/**
 * Get highlighted profile IDs (for golden border)
 */
export const getHighlightedProfileIds = async () => {
    const now = new Date();

    const highlighted = await prisma.profileBoost.findMany({
        where: {
            status: 'ACTIVE',
            isHighlighted: true,
            expiresAt: { gt: now },
        },
        select: { userId: true },
    });

    return highlighted.map(h => h.userId);
};

/**
 * Expire old boosts (run via cron)
 */
export const expireOldBoosts = async () => {
    const now = new Date();

    const result = await prisma.profileBoost.updateMany({
        where: {
            status: 'ACTIVE',
            expiresAt: { lte: now },
        },
        data: {
            status: 'EXPIRED',
        },
    });

    if (result.count > 0) {
        logger.info(`Expired ${result.count} boosts`);
    }

    return result.count;
};

/**
 * Get all available boost packages
 */
export const getBoostPackages = () => {
    return Object.values(BOOST_PACKAGES);
};

export default {
    activateBoost,
    getActiveBoost,
    getBoostedProfileIds,
    getHighlightedProfileIds,
    expireOldBoosts,
    getBoostPackages,
    BOOST_PACKAGES,
};
