/**
 * Subscription Plans Seed Data
 * Creates exactly 2 plans: Basic (₹299) and Premium (₹999)
 */

import prisma from '../src/config/database.js';

const subscriptionPlans = [
    {
        name: 'Basic',
        slug: 'basic',
        nameEn: 'Basic Plan',
        nameHi: 'बेसिक प्लान',
        nameCg: 'बेसिक प्लान',
        description: 'Perfect for starting your matrimonial journey',
        price: 299,
        originalPrice: 299,
        discountPercentage: 0,
        discountValidUntil: null,
        currency: 'INR',
        duration: 30, // 1 month
        features: JSON.stringify([
            '30 Contact Views',
            '50 Messages',
            '30 Interest Requests',
            'View Profile Photos',
            'Basic Search Filters',
        ]),
        maxContactViews: 30,
        maxMessagesSend: 50,
        maxInterestsSend: 30,
        canSeeProfileVisitors: false,
        priorityListing: false,
        verifiedBadge: false,
        incognitoMode: false,
        dedicatedManager: false,
        isActive: true,
        displayOrder: 1,
        isPopular: false,
    },
    {
        name: 'Premium',
        slug: 'premium',
        nameEn: 'Premium Plan',
        nameHi: 'प्रीमियम प्लान',
        nameCg: 'प्रीमियम प्लान',
        description: 'Unlimited access to find your perfect match',
        price: 999,
        originalPrice: 999,
        discountPercentage: 0,
        discountValidUntil: null,
        currency: 'INR',
        duration: 30, // 1 month (same as Basic)
        features: JSON.stringify([
            'Unlimited Contact Views',
            'Unlimited Messages',
            'Unlimited Interest Requests',
            'See Who Viewed Your Profile',
            'Priority Listing in Search',
            'Verified Badge',
            'Incognito Mode',
            'Advanced Search Filters',
        ]),
        maxContactViews: 0, // 0 = unlimited
        maxMessagesSend: 0,
        maxInterestsSend: 0,
        canSeeProfileVisitors: true,
        priorityListing: true,
        verifiedBadge: true,
        incognitoMode: true,
        dedicatedManager: false,
        isActive: true,
        displayOrder: 2,
        isPopular: true,
    },
];

async function seedPlans() {
    console.log('🌱 Seeding subscription plans...');

    // Delete all existing plans first
    await prisma.subscriptionPlan.deleteMany({});
    console.log('✓ Cleared existing plans');

    // Create the 2 plans
    for (const plan of subscriptionPlans) {
        await prisma.subscriptionPlan.create({
            data: plan,
        });
        console.log(`✓ Created ${plan.name} plan - ₹${plan.price}`);
    }

    console.log('✅ Subscription plans seeded successfully!');
}

seedPlans()
    .catch((e) => {
        console.error('❌ Error seeding plans:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
