// Run this script to make a user an ADMIN
// Usage: node scripts/make-admin.js your-email@gmail.com

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function makeAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.log('Usage: node scripts/make-admin.js <email>');
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });

        console.log(`✅ Successfully made ${user.email} an ADMIN!`);
        console.log(`User ID: ${user.id}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        console.log('Make sure the user exists and the email is correct.');
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
