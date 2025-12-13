/**
 * Add Profile Photos to Seeded Profiles
 * Generates avatar URLs and creates Media entries
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate UI Avatars URL
const generateAvatarUrl = (firstName, lastName, gender) => {
    const name = `${firstName}+${lastName}`;
    // Different background colors for male/female
    const bgColor = gender === 'MALE' ? '4A90E2' : 'E91E63';
    return `https://ui-avatars.com/api/?name=${name}&size=500&background=${bgColor}&color=fff&bold=true&rounded=true`;
};

async function addProfilePhotos() {
    try {
        console.log('🖼️  Adding profile photos to seeded profiles...\n');

        // Get all profiles without media (seeded profiles)
        const profiles = await prisma.profile.findMany({
            where: {
                userId: { gte: 5 }, // Seeded profiles start from userId 5
            },
            include: {
                user: true,
                media: true,
            },
        });

        console.log(`Found ${profiles.length} profiles to update\n`);

        for (const profile of profiles) {
            // Skip if profile already has media
            if (profile.media && profile.media.length > 0) {
                console.log(`⏭️  Skipping ${profile.firstName} ${profile.lastName} - already has photos`);
                continue;
            }

            const avatarUrl = generateAvatarUrl(profile.firstName, profile.lastName, profile.gender);

            // Create Media entry
            await prisma.media.create({
                data: {
                    userId: profile.userId,
                    profileId: profile.id,
                    type: 'PROFILE_PHOTO',
                    url: avatarUrl,
                    thumbnailUrl: avatarUrl,
                    fileName: `${profile.firstName}_${profile.lastName}_avatar.png`,
                    fileSize: 0,
                    mimeType: 'image/png',
                    isDefault: true, // Mark as default/primary photo
                },
            });

            console.log(`✅ Added photo for: ${profile.firstName} ${profile.lastName} (${profile.gender})`);
        }

        console.log('\n✨ Successfully added profile photos to all seeded profiles!');
        console.log('📱 Refresh your app to see the changes.\n');

    } catch (error) {
        console.error('❌ Error adding profile photos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

addProfilePhotos();
