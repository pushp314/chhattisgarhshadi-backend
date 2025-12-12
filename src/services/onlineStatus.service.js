/**
 * Online Status Service
 * Manages last seen and online status
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Update user's online status
 */
export const updateOnlineStatus = async (userId, isOnline) => {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isOnline,
                lastSeen: isOnline ? null : new Date(),
            },
        });
        return true;
    } catch (error) {
        logger.error('Error updating online status:', error);
        return false;
    }
};

/**
 * Set user as online
 */
export const setOnline = async (userId) => {
    return updateOnlineStatus(userId, true);
};

/**
 * Set user as offline and update last seen
 */
export const setOffline = async (userId) => {
    return updateOnlineStatus(userId, false);
};

/**
 * Get user's online status
 */
export const getOnlineStatus = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                isOnline: true,
                lastSeen: true,
            },
        });

        if (!user) {
            return { isOnline: false, lastSeen: null };
        }

        return {
            isOnline: user.isOnline || false,
            lastSeen: user.lastSeen,
            lastSeenText: formatLastSeen(user.lastSeen, user.isOnline),
        };
    } catch (error) {
        logger.error('Error getting online status:', error);
        return { isOnline: false, lastSeen: null };
    }
};

/**
 * Format last seen for display
 */
const formatLastSeen = (lastSeen, isOnline) => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Offline';

    const now = new Date();
    const diff = now - new Date(lastSeen);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return new Date(lastSeen).toLocaleDateString();
};

/**
 * Get online status for multiple users
 */
export const getBulkOnlineStatus = async (userIds) => {
    try {
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                isOnline: true,
                lastSeen: true,
            },
        });

        return users.reduce((acc, user) => {
            acc[user.id] = {
                isOnline: user.isOnline || false,
                lastSeen: user.lastSeen,
                lastSeenText: formatLastSeen(user.lastSeen, user.isOnline),
            };
            return acc;
        }, {});
    } catch (error) {
        logger.error('Error getting bulk online status:', error);
        return {};
    }
};

export default {
    setOnline,
    setOffline,
    getOnlineStatus,
    getBulkOnlineStatus,
    updateOnlineStatus,
};
