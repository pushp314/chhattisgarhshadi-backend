/**
 * Update Profile Photos with Real Stock Images
 * Uses RandomUser.me API for realistic profile photos
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';

const prisma = new PrismaClient();

// Fetch a batch of random user photos from RandomUser.me
const fetchRandomUserPhotos = (count, gender) => {
    return new Promise((resolve, reject) => {
        const url = `https://randomuser.me/api/?results=${count}&gender=${gender}&inc=picture,name&nat=in`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.results);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

async function updateProfilePhotos() {
    try {
        console.log('📸 Fetching real stock photos for profiles...\n');

        // Get male profiles  
        const maleProfiles = await prisma.profile.findMany({
            where: {
                userId: { gte: 5 },
                gender: 'MALE',
            },
            include: {
                media: true,
            },
        });

        // Get female profiles
        const femaleProfiles = await prisma.profile.findMany({
            where: {
                userId: { gte: 5 },
                gender: 'FEMALE',
            },
            include: {
                media: true,
            },
        });

        console.log(`Found ${maleProfiles.length} male and ${femaleProfiles.length} female profiles\n`);

        // Fetch stock photos
        console.log('🌐 Fetching male photos from RandomUser.me API...');
        const malePhotos = await fetchRandomUserPhotos(maleProfiles.length, 'male');

        console.log('🌐 Fetching female photos from RandomUser.me API...');
        const femalePhotos = await fetchRandomUserPhotos(femaleProfiles.length, 'female');

        console.log('\n✅ Photos fetched successfully!\n');

        // Update male profiles
        for (let i = 0; i < maleProfiles.length; i++) {
            const profile = maleProfiles[i];
            const photoUrl = malePhotos[i].picture.large; // High quality 200x200

            if (profile.media && profile.media.length > 0) {
                // Update existing media
                await prisma.media.update({
                    where: { id: profile.media[0].id },
                    data: {
                        url: photoUrl,
                        thumbnailUrl: photoUrl,
                    },
                });
                console.log(`✅ Updated photo for: ${profile.firstName} ${profile.lastName} (MALE)`);
            } else {
                // Create new media
                await prisma.media.create({
                    data: {
                        userId: profile.userId,
                        profileId: profile.id,
                        type: 'PROFILE_PHOTO',
                        url: photoUrl,
                        thumbnailUrl: photoUrl,
                        fileName: `${profile.firstName}_${profile.lastName}_photo.jpg`,
                        fileSize: 0,
                        mimeType: 'image/jpeg',
                        isDefault: true,
                    },
                });
                console.log(`✅ Added photo for: ${profile.firstName} ${profile.lastName} (MALE)`);
            }
        }

        // Update female profiles
        for (let i = 0; i < femaleProfiles.length; i++) {
            const profile = femaleProfiles[i];
            const photoUrl = femalePhotos[i].picture.large;

            if (profile.media && profile.media.length > 0) {
                // Update existing media
                await prisma.media.update({
                    where: { id: profile.media[0].id },
                    data: {
                        url: photoUrl,
                        thumbnailUrl: photoUrl,
                    },
                });
                console.log(`✅ Updated photo for: ${profile.firstName} ${profile.lastName} (FEMALE)`);
            } else {
                // Create new media
                await prisma.media.create({
                    data: {
                        userId: profile.userId,
                        profileId: profile.id,
                        type: 'PROFILE_PHOTO',
                        url: photoUrl,
                        thumbnailUrl: photoUrl,
                        fileName: `${profile.firstName}_${profile.lastName}_photo.jpg`,
                        fileSize: 0,
                        mimeType: 'image/jpeg',
                        isDefault: true,
                    },
                });
                console.log(`✅ Added photo for: ${profile.firstName} ${profile.lastName} (FEMALE)`);
            }
        }

        console.log('\n🎉 Successfully updated all profile photos with real stock images!');
        console.log('📱 Restart your app to see the changes.\n');

    } catch (error) {
        console.error('❌ Error updating profile photos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateProfilePhotos();
