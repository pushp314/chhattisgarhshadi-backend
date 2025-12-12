/**
 * Read Receipts Service
 * Manages message read status
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Mark messages as read
 * @param {number} userId - The reader's user ID
 * @param {number} senderId - The sender's user ID (marks their messages as read)
 */
export const markMessagesAsRead = async (userId, senderId) => {
    try {
        const result = await prisma.message.updateMany({
            where: {
                senderId: senderId,
                receiverId: userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
                status: 'READ',
            },
        });

        return {
            success: true,
            count: result.count,
        };
    } catch (error) {
        logger.error('Error marking messages as read:', error);
        return { success: false, count: 0 };
    }
};

/**
 * Mark single message as read
 */
export const markMessageAsRead = async (messageId, userId) => {
    try {
        const message = await prisma.message.update({
            where: {
                id: messageId,
                receiverId: userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
                status: 'READ',
            },
        });

        return { success: true, message };
    } catch (error) {
        logger.error('Error marking message as read:', error);
        return { success: false };
    }
};

/**
 * Mark message as delivered (received by device)
 */
export const markMessageAsDelivered = async (messageId) => {
    try {
        const message = await prisma.message.update({
            where: {
                id: messageId,
                status: 'SENT',
            },
            data: {
                status: 'DELIVERED',
                deliveredAt: new Date(),
            },
        });

        return { success: true, message };
    } catch (error) {
        logger.error('Error marking message as delivered:', error);
        return { success: false };
    }
};

/**
 * Get read receipt status for messages
 */
export const getMessageStatus = async (messageIds) => {
    try {
        const messages = await prisma.message.findMany({
            where: { id: { in: messageIds } },
            select: {
                id: true,
                status: true,
                readAt: true,
                deliveredAt: true,
                createdAt: true,
            },
        });

        return messages.reduce((acc, msg) => {
            acc[msg.id] = {
                status: msg.status || 'SENT',
                readAt: msg.readAt,
                deliveredAt: msg.deliveredAt,
                sentAt: msg.createdAt,
            };
            return acc;
        }, {});
    } catch (error) {
        logger.error('Error getting message status:', error);
        return {};
    }
};

/**
 * Get unread message count per sender
 */
export const getUnreadCounts = async (userId) => {
    try {
        const unreadCounts = await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                receiverId: userId,
                readAt: null,
            },
            _count: {
                id: true,
            },
        });

        return unreadCounts.reduce((acc, item) => {
            acc[item.senderId] = item._count.id;
            return acc;
        }, {});
    } catch (error) {
        logger.error('Error getting unread counts:', error);
        return {};
    }
};

export default {
    markMessagesAsRead,
    markMessageAsRead,
    markMessageAsDelivered,
    getMessageStatus,
    getUnreadCounts,
};
