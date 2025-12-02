import prisma from '../src/config/database.js';
import { logger } from '../src/config/logger.js';

/**
 * Seed Subscription Plans
 * Two plans: ₹299 (Basic) and ₹999 (Premium)
 */
async function seedSubscriptionPlans() {
    logger.info('🌱 Seeding subscription plans...');

    const plans = [
        {
            name: 'Basic Plan',
            slug: 'basic-plan',
            nameEn: 'Basic Plan',
            nameHi: 'बेसिक प्लान',
            nameCg: 'बेसिक योजना',
            description: 'Perfect for getting started with your matrimonial journey',
            price: 299.00,
            currency: 'INR',
            duration: 30, // 30 days (1 month)
            features: JSON.stringify([
                'View up to 50 contact details',
                'Send up to 100 messages',
                'Send up to 30 match requests',
                'Basic profile visibility',
                'Email support'
            ]),
            maxContactViews: 50,
            maxMessagesSend: 100,
            maxInterestsSend: 30,
            canSeeProfileVisitors: false,
            priorityListing: false,
            verifiedBadge: false,
            incognitoMode: false,
            dedicatedManager: false,
            isActive: true,
            displayOrder: 1,
            isPopular: false
        },
        {
            name: 'Premium Plan',
            slug: 'premium-plan',
            nameEn: 'Premium Plan',
            nameHi: 'प्रीमियम प्लान',
            nameCg: 'प्रीमियम योजना',
            description: 'Complete access with all premium features for serious matchmaking',
            price: 999.00,
            currency: 'INR',
            duration: 90, // 90 days (3 months)
            features: JSON.stringify([
                'Unlimited contact views',
                'Unlimited messages',
                'Unlimited match requests',
                'See who viewed your profile',
                'Priority listing in search results',
                'Verified badge on profile',
                'Incognito mode (browse anonymously)',
                'Dedicated relationship manager',
                'Priority customer support',
                'Advanced search filters'
            ]),
            maxContactViews: 0, // 0 = unlimited
            maxMessagesSend: 0,
            maxInterestsSend: 0,
            canSeeProfileVisitors: true,
            priorityListing: true,
            verifiedBadge: true,
            incognitoMode: true,
            dedicatedManager: true,
            isActive: true,
            displayOrder: 2,
            isPopular: true // Mark as popular/recommended
        }
    ];

    for (const planData of plans) {
        const existingPlan = await prisma.subscriptionPlan.findUnique({
            where: { slug: planData.slug }
        });

        if (existingPlan) {
            logger.info(`✅ Plan "${planData.name}" already exists, updating...`);
            await prisma.subscriptionPlan.update({
                where: { slug: planData.slug },
                data: planData
            });
        } else {
            logger.info(`✨ Creating plan "${planData.name}"...`);
            await prisma.subscriptionPlan.create({
                data: planData
            });
        }
    }

    logger.info('✅ Subscription plans seeded successfully!');
}

/**
 * Main seed function
 */
async function main() {
    try {
        await seedSubscriptionPlans();
        logger.info('🎉 Database seeding completed!');
    } catch (error) {
        logger.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
