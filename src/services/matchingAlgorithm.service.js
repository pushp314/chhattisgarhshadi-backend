/**
 * Smart Matching Algorithm Service
 * FREE rule-based matching system with weighted scoring
 */

import prisma from '../config/database.js';
import { getCompatibility } from './astrology.service.js';

// Scoring weights (must sum to 100)
const WEIGHTS = {
    PREFERENCES: 35,      // Age, height, education, income, marital status
    LOCATION: 15,         // Same city/state/country
    LIFESTYLE: 15,        // Diet, smoking, drinking
    RELIGION_CASTE: 20,   // Religion, caste, gotra
    ASTROLOGY: 15,        // Guna matching (if available)
};

/**
 * Calculate match score between two users
 * @param {number} userId - The user looking for matches
 * @param {number} targetUserId - The potential match
 * @returns {Object} Match score and breakdown
 */
export const calculateMatchScore = async (userId, targetUserId) => {
    try {
        // Fetch both profiles with preferences
        const [userProfile, targetProfile] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId },
                include: {
                    partnerPreference: true,
                    user: { select: { id: true } },
                },
            }),
            prisma.profile.findUnique({
                where: { userId: targetUserId },
                include: {
                    partnerPreference: true,
                    user: { select: { id: true } },
                },
            }),
        ]);

        if (!userProfile || !targetProfile) {
            return { score: 0, error: 'Profile not found' };
        }

        const breakdown = {};

        // 1. Preference matching (35%)
        breakdown.preferences = calculatePreferenceScore(
            userProfile.partnerPreference,
            targetProfile
        );

        // 2. Location matching (15%)
        breakdown.location = calculateLocationScore(userProfile, targetProfile);

        // 3. Lifestyle compatibility (15%)
        breakdown.lifestyle = calculateLifestyleScore(userProfile, targetProfile);

        // 4. Religion & Caste (20%)
        breakdown.religionCaste = calculateReligionScore(
            userProfile.partnerPreference,
            targetProfile
        );

        // 5. Astrology (15%) - Use existing service
        breakdown.astrology = await calculateAstrologyScore(userId, targetUserId);

        // Calculate weighted total
        const totalScore = Math.round(
            (breakdown.preferences * WEIGHTS.PREFERENCES +
                breakdown.location * WEIGHTS.LOCATION +
                breakdown.lifestyle * WEIGHTS.LIFESTYLE +
                breakdown.religionCaste * WEIGHTS.RELIGION_CASTE +
                breakdown.astrology * WEIGHTS.ASTROLOGY) / 100
        );

        return {
            score: totalScore,
            maxScore: 100,
            percentage: totalScore,
            breakdown,
            compatibility: getCompatibilityLabel(totalScore),
            isSuperMatch: totalScore >= 85,
        };
    } catch (error) {
        console.error('Error calculating match score:', error);
        return { score: 0, error: error.message };
    }
};

/**
 * Calculate preference score (age, height, education, income)
 */
const calculatePreferenceScore = (preferences, targetProfile) => {
    if (!preferences) return 50; // Default if no preferences set

    let score = 0;
    let factors = 0;

    // Age check
    if (preferences.minAge && preferences.maxAge && targetProfile.dateOfBirth) {
        const age = calculateAge(targetProfile.dateOfBirth);
        if (age >= preferences.minAge && age <= preferences.maxAge) {
            score += 100;
        } else {
            // Partial score for close matches
            const diff = Math.min(
                Math.abs(age - preferences.minAge),
                Math.abs(age - preferences.maxAge)
            );
            score += Math.max(0, 100 - diff * 10);
        }
        factors++;
    }

    // Height check
    if (preferences.minHeight && preferences.maxHeight && targetProfile.height) {
        if (targetProfile.height >= preferences.minHeight &&
            targetProfile.height <= preferences.maxHeight) {
            score += 100;
        } else {
            const diff = Math.min(
                Math.abs(targetProfile.height - preferences.minHeight),
                Math.abs(targetProfile.height - preferences.maxHeight)
            );
            score += Math.max(0, 100 - diff * 5);
        }
        factors++;
    }

    // Education check
    if (preferences.education && targetProfile.education) {
        const eduRank = getEducationRank(targetProfile.education);
        const prefRank = getEducationRank(preferences.education);
        if (eduRank >= prefRank) {
            score += 100;
        } else {
            score += Math.max(0, 100 - (prefRank - eduRank) * 20);
        }
        factors++;
    }

    // Income check
    if (preferences.minIncome && targetProfile.annualIncome) {
        const income = parseIncomeToNumber(targetProfile.annualIncome);
        const minIncome = preferences.minIncome;
        if (income >= minIncome) {
            score += 100;
        } else {
            score += Math.max(0, (income / minIncome) * 100);
        }
        factors++;
    }

    // Marital status check
    if (preferences.maritalStatus && targetProfile.maritalStatus) {
        const prefStatuses = preferences.maritalStatus;
        if (prefStatuses.includes(targetProfile.maritalStatus)) {
            score += 100;
        }
        factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 50;
};

/**
 * Calculate location score
 */
const calculateLocationScore = (profile1, profile2) => {
    if (profile1.city && profile2.city && profile1.city === profile2.city) {
        return 100; // Same city
    }
    if (profile1.state && profile2.state && profile1.state === profile2.state) {
        return 75; // Same state
    }
    if (profile1.country && profile2.country && profile1.country === profile2.country) {
        return 50; // Same country
    }
    return 25; // Different country
};

/**
 * Calculate lifestyle compatibility
 */
const calculateLifestyleScore = (profile1, profile2) => {
    let score = 0;
    let factors = 0;

    // Diet compatibility
    if (profile1.diet && profile2.diet) {
        if (profile1.diet === profile2.diet) {
            score += 100;
        } else if (
            (profile1.diet === 'VEGETARIAN' && profile2.diet === 'EGGETARIAN') ||
            (profile1.diet === 'EGGETARIAN' && profile2.diet === 'VEGETARIAN')
        ) {
            score += 70; // Similar diets
        } else {
            score += 30;
        }
        factors++;
    }

    // Smoking compatibility
    if (profile1.smoking && profile2.smoking) {
        if (profile1.smoking === profile2.smoking) {
            score += 100;
        } else if (
            profile1.smoking === 'NO' && profile2.smoking !== 'NO'
        ) {
            score += 20; // Non-smoker with smoker
        } else {
            score += 50;
        }
        factors++;
    }

    // Drinking compatibility
    if (profile1.drinking && profile2.drinking) {
        if (profile1.drinking === profile2.drinking) {
            score += 100;
        } else if (
            (profile1.drinking === 'OCCASIONALLY' && profile2.drinking === 'SOCIALLY') ||
            (profile1.drinking === 'SOCIALLY' && profile2.drinking === 'OCCASIONALLY')
        ) {
            score += 80;
        } else {
            score += 40;
        }
        factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 50;
};

/**
 * Calculate religion and caste score
 */
const calculateReligionScore = (preferences, targetProfile) => {
    if (!preferences) return 50;

    let score = 0;
    let factors = 0;

    // Religion
    if (preferences.religion && targetProfile.religion) {
        const prefReligions = preferences.religion;
        if (prefReligions.includes(targetProfile.religion)) {
            score += 100;
        } else {
            score += 0; // Religion mismatch is significant
        }
        factors++;
    }

    // Caste
    if (preferences.caste && targetProfile.caste) {
        const prefCastes = preferences.caste;
        if (prefCastes.includes(targetProfile.caste)) {
            score += 100;
        } else {
            score += 30; // Some flexibility for caste
        }
        factors++;
    }

    // Mother tongue
    if (preferences.motherTongue && targetProfile.motherTongue) {
        const prefLanguages = preferences.motherTongue;
        if (prefLanguages.includes(targetProfile.motherTongue)) {
            score += 100;
        } else {
            score += 50; // Language difference is less critical
        }
        factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 50;
};

/**
 * Calculate astrology score using existing service
 */
const calculateAstrologyScore = async (userId, targetUserId) => {
    try {
        const compatibility = await getCompatibility(userId, targetUserId);
        if (compatibility && compatibility.percentage) {
            return compatibility.percentage;
        }
        return 50; // Default if astrology data unavailable
    } catch {
        return 50;
    }
};

/**
 * Get compatibility label based on score
 */
const getCompatibilityLabel = (score) => {
    if (score >= 90) return 'Perfect Match! 💫';
    if (score >= 80) return 'Excellent Match! 🎉';
    if (score >= 70) return 'Great Match! ⭐';
    if (score >= 60) return 'Good Match 👍';
    if (score >= 50) return 'Compatible 😊';
    return 'Worth Exploring 🤔';
};

/**
 * Get daily recommendations for a user
 */
export const getDailyRecommendations = async (userId, limit = 10) => {
    try {
        // Get user's profile and preferences
        const userProfile = await prisma.profile.findUnique({
            where: { userId },
            include: {
                partnerPreference: true,
                user: { select: { gender: true } },
            },
        });

        if (!userProfile) {
            return [];
        }

        // Determine opposite gender
        const targetGender = userProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';

        // Get potential matches (excluding blocked, already matched, etc.)
        const potentialMatches = await prisma.profile.findMany({
            where: {
                gender: targetGender,
                userId: { not: userId },
                user: {
                    isActive: true,
                    isProfileComplete: true,
                    // Exclude blocked users
                    blockedBy: { none: { blockerId: userId } },
                    blockedUsers: { none: { blockedId: userId } },
                },
            },
            include: {
                user: { select: { id: true } },
                photos: { take: 1 },
            },
            take: 50, // Get top 50 candidates for scoring
        });

        // Calculate scores for each potential match
        const scoredMatches = await Promise.all(
            potentialMatches.map(async (match) => {
                const matchResult = await calculateMatchScore(userId, match.userId);
                return {
                    profile: match,
                    ...matchResult,
                };
            })
        );

        // Sort by score and return top N
        const topMatches = scoredMatches
            .filter((m) => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return topMatches;
    } catch (error) {
        console.error('Error getting daily recommendations:', error);
        return [];
    }
};

/**
 * Get "Super Matches" (85%+ compatibility)
 */
export const getSuperMatches = async (userId, limit = 5) => {
    const recommendations = await getDailyRecommendations(userId, 20);
    return recommendations.filter((m) => m.score >= 85).slice(0, limit);
};

// Helper functions
const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

const getEducationRank = (education) => {
    const ranks = {
        BELOW_10TH: 1,
        '10TH': 2,
        '12TH': 3,
        DIPLOMA: 4,
        BACHELORS: 5,
        MASTERS: 6,
        DOCTORATE: 7,
    };
    return ranks[education] || 3;
};

const parseIncomeToNumber = (income) => {
    if (!income) return 0;
    // Handle string income ranges like "5-10 LPA"
    if (typeof income === 'string') {
        const match = income.match(/(\d+)/);
        return match ? parseInt(match[1]) * 100000 : 0;
    }
    return income;
};

export default {
    calculateMatchScore,
    getDailyRecommendations,
    getSuperMatches,
};
