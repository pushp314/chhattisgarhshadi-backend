
import matchingService from './src/services/matchingAlgorithm.service.js';

// Mock Data
const userProfile = {
    id: 1,
    gender: 'MALE',
    partnerPreference: {
        religion: ['HINDU'],
        motherTongue: ['CHHATTISGARHI'],
        ageFrom: 20,
        ageTo: 30,
        heightFrom: 150,
        heightTo: 180
    },
    category: 'OBC',
    nativeVillage: 'RaipurVillage',
    speaksChhattisgarhi: true,
    gothram: 'Kashyap',
    subCaste: 'Sahu'
};

const profilesToCheck = [
    {
        id: 2,
        firstName: 'Perfect Match',
        gender: 'FEMALE',
        religion: 'HINDU',
        motherTongue: 'CHHATTISGARHI',
        dateOfBirth: '2000-01-01', // 25 years old
        height: 160,
        category: 'OBC', // Match
        nativeVillage: 'RaipurVillage', // Match (+100 boost)
        speaksChhattisgarhi: true, // Match
        gothram: 'Bharadwaj', // Diff gothram (Good)
        subCaste: 'Sahu', // Match
        city: 'Raipur',
        state: 'Chhattisgarh'
    },
    {
        id: 3,
        firstName: 'Good Match',
        gender: 'FEMALE',
        religion: 'HINDU',
        motherTongue: 'HINDI',
        dateOfBirth: '2000-01-01',
        height: 160,
        category: 'GENERAL', // Mismatch
        nativeVillage: 'OtherVillage', // Mismatch
        speaksChhattisgarhi: false, // Mismatch
        gothram: 'Kashyap', // Same gothram (Bad?)
        city: 'Bhilai',
        state: 'Chhattisgarh'
    }
];

console.log('Testing Matching Algorithm...');

async function test() {
    for (const targetProfile of profilesToCheck) {
        try {
            const score = matchingService.calculateMatchScore(userProfile, targetProfile);
            console.log(`\nMatch with ${targetProfile.firstName}:`);
            console.log(`Score: ${score.totalScore}`);
            console.log('Breakdown:', JSON.stringify(score.breakdown, null, 2));
        } catch (e) {
            console.error('Error calculating score:', e);
        }
    }
}

test();
