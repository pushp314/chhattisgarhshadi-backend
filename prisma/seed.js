/**
 * Database Seed Script
 * Seeds 20 fake profiles (10 male, 10 female) for testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Chhattisgarh cities
const cities = [
    'Raipur', 'Bilaspur', 'Durg', 'Bhilai', 'Korba',
    'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Dhamtari'
];

const states = ['Chhattisgarh'];
const religions = ['HINDU', 'HINDU', 'HINDU', 'HINDU', 'HINDU', 'MUSLIM', 'CHRISTIAN', 'JAIN', 'SIKH', 'BUDDHIST'];
const castes = ['BRAHMIN', 'KSHATRIYA', 'VAISH', 'KAYASTH', 'AGRAWAL', 'RAJPUT', 'MARWARI', 'SINDHI'];
const educations = ['BACHELORS', 'MASTERS', 'DOCTORATE', 'DIPLOMA', '12TH'];
const occupations = ['Software Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Government Employee', 'Bank Manager', 'Lawyer', 'CA', 'Engineer', 'Professor'];
const diets = ['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN'];
const maritalStatuses = ['NEVER_MARRIED', 'NEVER_MARRIED', 'NEVER_MARRIED', 'DIVORCED', 'WIDOWED'];
const familyTypes = ['NUCLEAR', 'JOINT', 'EXTENDED'];

// Male names (First + Last)
const maleNames = [
    { first: 'Rahul', last: 'Sharma' },
    { first: 'Amit', last: 'Verma' },
    { first: 'Vikram', last: 'Singh' },
    { first: 'Rajesh', last: 'Patel' },
    { first: 'Sanjay', last: 'Gupta' },
    { first: 'Prashant', last: 'Tiwari' },
    { first: 'Deepak', last: 'Agrawal' },
    { first: 'Suresh', last: 'Yadav' },
    { first: 'Manish', last: 'Kumar' },
    { first: 'Arun', last: 'Joshi' },
];

// Female names (First + Last)
const femaleNames = [
    { first: 'Priya', last: 'Sharma' },
    { first: 'Anjali', last: 'Verma' },
    { first: 'Neha', last: 'Singh' },
    { first: 'Pooja', last: 'Patel' },
    { first: 'Kavita', last: 'Gupta' },
    { first: 'Swati', last: 'Tiwari' },
    { first: 'Ritu', last: 'Agrawal' },
    { first: 'Meera', last: 'Yadav' },
    { first: 'Sunita', last: 'Kumar' },
    { first: 'Lakshmi', last: 'Joshi' },
];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomAge = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomHeight = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomWeight = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDOB = (age) => {
    const now = new Date();
    const year = now.getFullYear() - age;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    return new Date(year, month, day);
};

const generateBio = (name, occupation, city) => {
    const templates = [
        `Hi, I'm ${name}. I work as a ${occupation} in ${city}. Looking for a life partner who shares similar values and interests.`,
        `${name} here! A ${occupation} based in ${city}. Believe in simple living and strong family bonds.`,
        `Hello! I'm ${name}, working as a ${occupation}. Love my family, culture, and traditions. Looking for a compatible partner.`,
        `I am ${name}, a ${occupation} from ${city}. Seeking a loving and caring life partner for a beautiful journey together.`,
    ];
    return getRandomItem(templates);
};

async function seed() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // Create 10 male profiles
        for (let i = 0; i < 10; i++) {
            const name = maleNames[i];
            const age = getRandomAge(25, 35);
            const city = getRandomItem(cities);
            const occupation = getRandomItem(occupations);
            const religion = getRandomItem(religions);

            const user = await prisma.user.create({
                data: {
                    email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}${i}@example.com`,
                    googleId: `google_male_${Date.now()}_${i}`,
                    authProvider: 'GOOGLE',
                    isPhoneVerified: true,
                    phone: `98765${String(i).padStart(5, '0')}`,
                    isEmailVerified: true,
                    isActive: true,
                    profile: {
                        create: {
                            firstName: name.first,
                            lastName: name.last,
                            dateOfBirth: generateDOB(age),
                            gender: 'MALE',
                            bio: generateBio(name.first, occupation, city),
                            city: city,
                            state: 'Chhattisgarh',
                            country: 'India',
                            religion: religion,
                            caste: getRandomItem(castes),
                            height: getRandomHeight(165, 185),
                            weight: getRandomWeight(60, 85),
                            diet: getRandomItem(diets),
                            smokingHabit: 'NO',
                            drinkingHabit: getRandomItem(['NO', 'OCCASIONALLY', 'SOCIALLY']),
                            maritalStatus: getRandomItem(maritalStatuses),
                            motherTongue: 'HINDI',
                            familyType: getRandomItem(familyTypes),
                            speaksChhattisgarhi: Math.random() > 0.3,
                            isPublished: true, // Required for search API
                            publishedAt: new Date(), // Set publish timestamp
                            profileCompleteness: 60, // Minimum required for search visibility
                        },
                    },
                },
                include: { profile: true },
            });

            // Create profile photo with generated avatar
            const avatarUrl = `https://ui-avatars.com/api/?name=${name.first}+${name.last}&size=500&background=4A90E2&color=fff&bold=true&rounded=true`;
            await prisma.media.create({
                data: {
                    userId: user.id,
                    profileId: user.profile.id,
                    type: 'PROFILE_PHOTO',
                    url: avatarUrl,
                    thumbnailUrl: avatarUrl,
                    fileName: `${name.first}_${name.last}_avatar.png`,
                    fileSize: 0,
                    mimeType: 'image/png',
                    isDefault: true,
                },
            });

            console.log(`✅ Created male profile: ${name.first} ${name.last} (${age} years, ${city})`);
        }

        // Create 10 female profiles
        for (let i = 0; i < 10; i++) {
            const name = femaleNames[i];
            const age = getRandomAge(22, 32);
            const city = getRandomItem(cities);
            const occupation = getRandomItem(occupations);
            const religion = getRandomItem(religions);

            const user = await prisma.user.create({
                data: {
                    email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}${i}@example.com`,
                    googleId: `google_female_${Date.now()}_${i}`,
                    authProvider: 'GOOGLE',
                    isPhoneVerified: true,
                    phone: `98766${String(i).padStart(5, '0')}`,
                    isEmailVerified: true,
                    isActive: true,
                    profile: {
                        create: {
                            firstName: name.first,
                            lastName: name.last,
                            dateOfBirth: generateDOB(age),
                            gender: 'FEMALE',
                            bio: generateBio(name.first, occupation, city),
                            city: city,
                            state: 'Chhattisgarh',
                            country: 'India',
                            religion: religion,
                            caste: getRandomItem(castes),
                            height: getRandomHeight(150, 170),
                            weight: getRandomWeight(45, 65),
                            diet: getRandomItem(diets),
                            smokingHabit: 'NO',
                            drinkingHabit: getRandomItem(['NO', 'OCCASIONALLY']),
                            maritalStatus: getRandomItem(maritalStatuses),
                            motherTongue: 'HINDI',
                            familyType: getRandomItem(familyTypes),
                            speaksChhattisgarhi: Math.random() > 0.3,
                            isPublished: true, // Required for search API
                            publishedAt: new Date(), // Set publish timestamp
                            profileCompleteness: 60, // Minimum required for search visibility
                        },
                    },
                },
                include: { profile: true },
            });

            // Create profile photo with generated avatar
            const avatarUrl = `https://ui-avatars.com/api/?name=${name.first}+${name.last}&size=500&background=E91E63&color=fff&bold=true&rounded=true`;
            await prisma.media.create({
                data: {
                    userId: user.id,
                    profileId: user.profile.id,
                    type: 'PROFILE_PHOTO',
                    url: avatarUrl,
                    thumbnailUrl: avatarUrl,
                    fileName: `${name.first}_${name.last}_avatar.png`,
                    fileSize: 0,
                    mimeType: 'image/png',
                    isDefault: true,
                },
            });

            console.log(`✅ Created female profile: ${name.first} ${name.last} (${age} years, ${city})`);
        }

        console.log('\n🎉 Seeding completed! Created 20 profiles (10 male, 10 female)');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();
