/**
 * Contact Visibility Service
 * Controls who can see contact information
 * Only users with ACCEPTED connection requests can view contact details
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Check if user can view another user's contact information
 * Rules:
 * - Admin can view all
 * - Own profile can be viewed
 * - Only ACCEPTED interest/request can view contact
 * 
 * @param {number} viewerId - User trying to view contact
 * @param {number} profileOwnerId - User whose contact is being viewed
 * @returns {Promise<{canView: boolean, reason: string}>}
 */
export const canViewContactInfo = async (viewerId, profileOwnerId) => {
    // Same user - always allowed
    if (viewerId === profileOwnerId) {
        return { canView: true, reason: 'own_profile' };
    }

    try {
        // Check if viewer is admin
        const viewer = await prisma.user.findUnique({
            where: { id: viewerId },
            select: { role: true },
        });

        if (viewer?.role === 'ADMIN') {
            return { canView: true, reason: 'admin' };
        }

        // Check for ACCEPTED interest between the two users
        const acceptedInterest = await prisma.interest.findFirst({
            where: {
                OR: [
                    { senderId: viewerId, receiverId: profileOwnerId, status: 'ACCEPTED' },
                    { senderId: profileOwnerId, receiverId: viewerId, status: 'ACCEPTED' },
                ],
            },
        });

        if (acceptedInterest) {
            return { canView: true, reason: 'accepted_interest' };
        }

        // Check for direct contact request accepted
        const acceptedRequest = await prisma.contactRequest.findFirst({
            where: {
                OR: [
                    { senderId: viewerId, receiverId: profileOwnerId, status: 'ACCEPTED' },
                    { senderId: profileOwnerId, receiverId: viewerId, status: 'ACCEPTED' },
                ],
            },
        });

        if (acceptedRequest) {
            return { canView: true, reason: 'accepted_request' };
        }

        // No valid relationship found
        return { canView: false, reason: 'no_accepted_connection' };

    } catch (error) {
        logger.error('Error checking contact visibility:', error);
        return { canView: false, reason: 'error' };
    }
};

/**
 * Get contact info with visibility check and plan-based limits
 * @param {number} viewerId - User requesting contact info
 * @param {number} profileOwnerId - User whose contact is requested
 * @returns {Promise<object|null>}
 */
export const getContactInfoIfAllowed = async (viewerId, profileOwnerId) => {
    const { canView, reason } = await canViewContactInfo(viewerId, profileOwnerId);

    if (!canView) {
        return {
            allowed: false,
            reason,
            message: getVisibilityMessage(reason),
            contactInfo: null,
        };
    }

    // Check plan-based contact view limits for premium users
    const activeSubscription = await prisma.userSubscription.findFirst({
        where: {
            userId: viewerId,
            status: 'ACTIVE',
            endDate: { gt: new Date() },
        },
        include: {
            plan: true,
        },
        orderBy: { endDate: 'desc' },
    });

    // If user has a subscription with contact view limits
    if (activeSubscription && activeSubscription.plan.maxContactViews > 0) {
        const maxViews = activeSubscription.plan.maxContactViews;
        const usedViews = activeSubscription.contactViewsUsed;
        const remainingViews = maxViews - usedViews;

        // Check if user has exhausted their limit
        if (remainingViews <= 0) {
            return {
                allowed: false,
                reason: 'contact_limit_reached',
                message: `You have used all ${maxViews} contact views in your plan. Please upgrade to continue.`,
                contactInfo: null,
                remainingViews: 0,
                maxViews,
            };
        }

        // Increment usage counter
        await prisma.userSubscription.update({
            where: { id: activeSubscription.id },
            data: { contactViewsUsed: { increment: 1 } },
        });

        // Also increment profile's contactViewCount
        await prisma.profile.update({
            where: { userId: profileOwnerId },
            data: { contactViewCount: { increment: 1 } },
        });

        // Fetch contact info
        const user = await prisma.user.findUnique({
            where: { id: profileOwnerId },
            select: {
                phone: true,
                email: true,
                profile: {
                    select: {
                        alternatePhone: true,
                        whatsappNumber: true,
                    },
                },
            },
        });

        return {
            allowed: true,
            reason,
            contactInfo: {
                phone: user?.phone,
                email: user?.email,
                alternatePhone: user?.profile?.alternatePhone,
                whatsappNumber: user?.profile?.whatsappNumber,
            },
            remainingViews: remainingViews - 1,
            maxViews,
        };
    }

    // Unlimited contact views (admin, premium with no limits, or free feature)
    const user = await prisma.user.findUnique({
        where: { id: profileOwnerId },
        select: {
            phone: true,
            email: true,
            profile: {
                select: {
                    alternatePhone: true,
                    whatsappNumber: true,
                },
            },
        },
    });

    return {
        allowed: true,
        reason,
        contactInfo: {
            phone: user?.phone,
            email: user?.email,
            alternatePhone: user?.profile?.alternatePhone,
            whatsappNumber: user?.profile?.whatsappNumber,
        },
    };
};

/**
 * Get user-friendly message for visibility reason
 */
const getVisibilityMessage = (reason) => {
    const messages = {
        no_accepted_connection: 'Send an interest request for the user to accept before viewing contact details',
        error: 'Unable to check contact visibility. Please try again.',
    };
    return messages[reason] || 'Contact information is hidden';
};

/**
 * Mask contact info for non-connected users
 * Shows partial info like "98XXXXX789"
 */
export const maskContactInfo = (contactInfo) => {
    if (!contactInfo) return null;

    const maskPhone = (phone) => {
        if (!phone || phone.length < 6) return 'XXXXXXXXXX';
        return phone.slice(0, 2) + 'XXXXX' + phone.slice(-3);
    };

    const maskEmail = (email) => {
        if (!email) return null;
        const [name, domain] = email.split('@');
        if (!name || !domain) return 'xxx@xxx.com';
        return name[0] + '***@' + domain;
    };

    return {
        phone: maskPhone(contactInfo.phone),
        email: maskEmail(contactInfo.email),
        alternatePhone: contactInfo.alternatePhone ? maskPhone(contactInfo.alternatePhone) : null,
        whatsappNumber: contactInfo.whatsappNumber ? maskPhone(contactInfo.whatsappNumber) : null,
        isMasked: true,
    };
};

export default {
    canViewContactInfo,
    getContactInfoIfAllowed,
    maskContactInfo,
};
