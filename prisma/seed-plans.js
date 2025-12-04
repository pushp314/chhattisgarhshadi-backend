import prisma from '../src/config/database.js';

/**
 * Seed Subscription Plans
 * 
 * Run with: node prisma/seed-plans.js
 */

const subscriptionPlans = [
    {
        name: 'Basic',
        slug: 'basic',
        nameEn: 'Basic Plan',
        nameHi: 'बेसिक प्लान',
        nameCg: 'बेसिक प्लान',
        description: 'Get started with essential features for finding your partner.',
        price: 299.00,
        currency: 'INR',
        duration: 30, // 30 days = 1 month

        // Limits
        maxContactViews: 20,       // View 20 contact details
        maxMessagesSend: 50,       // Send 50 messages
        maxInterestsSend: 30,      // Send 30 match requests

        // Features
        canSeeProfileVisitors: true,   // See who viewed your profile
        priorityListing: false,         // No priority in search
        verifiedBadge: false,           // No verified badge
        incognitoMode: false,           // No incognito browsing
        dedicatedManager: false,        // No personal manager

        features: JSON.stringify([
            'Send up to 30 match requests',
            'Chat with matched profiles (50 messages)',
            'View 20 contact details',
            'See who viewed your profile',
            'Basic search filters',
        ]),

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
        description: 'Unlock all features and find your perfect match faster!',
        price: 999.00,
        currency: 'INR',
        duration: 30, // 30 days = 1 month

        // Limits (0 = unlimited)
        maxContactViews: 0,        // Unlimited contact views
        maxMessagesSend: 0,        // Unlimited messages
        maxInterestsSend: 0,       // Unlimited match requests

        // Features
        canSeeProfileVisitors: true,    // See who viewed your profile
        priorityListing: true,          // Appear higher in search results
        verifiedBadge: true,            // Premium verified badge
        incognitoMode: true,            // Browse profiles anonymously
        dedicatedManager: false,        // No personal manager

        features: JSON.stringify([
            'Unlimited match requests',
            'Unlimited chat messages',
            'Unlimited contact views',
            'See who viewed your profile',
            'Priority listing in search results',
            'Premium verified badge',
            'Incognito mode - browse anonymously',
            'Advanced search filters',
            'Horoscope matching (Guna Milan)',
        ]),

        isActive: true,
        displayOrder: 2,
        isPopular: true, // Highlighted as recommended
    },
];

async function seedPlans() {
    console.log('🌱 Seeding subscription plans...\n');

    for (const plan of subscriptionPlans) {
        const existing = await prisma.subscriptionPlan.findUnique({
            where: { slug: plan.slug },
        });

        if (existing) {
            // Update existing plan
            await prisma.subscriptionPlan.update({
                where: { slug: plan.slug },
                data: plan,
            });
            console.log(`✅ Updated: ${plan.name} (₹${plan.price}/month)`);
        } else {
            // Create new plan
            await prisma.subscriptionPlan.create({
                data: plan,
            });
            console.log(`✅ Created: ${plan.name} (₹${plan.price}/month)`);
        }
    }

    console.log('\n🎉 Subscription plans seeded successfully!\n');

    // Display summary
    const allPlans = await prisma.subscriptionPlan.findMany({
        orderBy: { displayOrder: 'asc' },
    });

    console.log('📋 Current Plans:');
    console.log('─'.repeat(50));
    allPlans.forEach(p => {
        console.log(`  ${p.isPopular ? '⭐' : '  '} ${p.name}: ₹${p.price} / ${p.duration} days`);
    });
    console.log('─'.repeat(50));
}

seedPlans()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error('❌ Error seeding plans:', e);
        prisma.$disconnect();
        process.exit(1);
    });
