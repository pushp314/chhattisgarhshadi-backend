/**
 * Profile Completion Service
 * Calculates profile completion percentage to encourage users to complete their profiles
 */

import prisma from '../config/database.js';

// Field weights for completion calculation
const PROFILE_FIELDS = {
    // Basic Info (30%)
    firstName: { weight: 5, required: true },
    lastName: { weight: 5, required: true },
    dateOfBirth: { weight: 5, required: true },
    gender: { weight: 5, required: true },
    height: { weight: 5, required: false },
    weight: { weight: 2, required: false },
    maritalStatus: { weight: 3, required: true },

    // Photos (20%)
    photos: { weight: 15, required: false, isArray: true, minCount: 1 },
    profilePhoto: { weight: 5, required: false },

    // Education & Career (15%)
    education: { weight: 5, required: false },
    occupation: { weight: 5, required: false },
    annualIncome: { weight: 3, required: false },
    employedIn: { weight: 2, required: false },

    // Religion & Community (15%)
    religion: { weight: 5, required: true },
    caste: { weight: 3, required: false },
    motherTongue: { weight: 3, required: false },
    gotra: { weight: 2, required: false },
    subCaste: { weight: 2, required: false },

    // Location (10%)
    country: { weight: 3, required: true },
    state: { weight: 3, required: true },
    city: { weight: 4, required: true },

    // About & Family (10%)
    bio: { weight: 4, required: false },
    aboutFamily: { weight: 3, required: false },
    partnerExpectations: { weight: 3, required: false },
};

/**
 * Calculate profile completion percentage
 * @param {object} profile - Profile object from database
 * @returns {{ percentage: number, completed: string[], pending: string[], tips: string[] }}
 */
export const calculateProfileCompletion = (profile) => {
    if (!profile) {
        return { percentage: 0, completed: [], pending: Object.keys(PROFILE_FIELDS), tips: ['Start by adding your basic information'] };
    }

    let totalWeight = 0;
    let earnedWeight = 0;
    const completed = [];
    const pending = [];
    const tips = [];

    for (const [field, config] of Object.entries(PROFILE_FIELDS)) {
        totalWeight += config.weight;

        const value = profile[field];
        let isComplete = false;

        if (config.isArray) {
            // For arrays like photos
            isComplete = Array.isArray(value) && value.length >= (config.minCount || 1);
        } else if (typeof value === 'string') {
            isComplete = value.trim().length > 0;
        } else if (typeof value === 'number') {
            isComplete = value > 0;
        } else if (value instanceof Date) {
            isComplete = true;
        } else {
            isComplete = value !== null && value !== undefined;
        }

        if (isComplete) {
            earnedWeight += config.weight;
            completed.push(field);
        } else {
            pending.push(field);
            if (config.required) {
                tips.push(getFieldTip(field));
            }
        }
    }

    const percentage = Math.round((earnedWeight / totalWeight) * 100);

    // Add general tips based on completion level
    if (percentage < 50) {
        tips.unshift('Complete your profile to get 3x more matches!');
    } else if (percentage < 80) {
        tips.unshift('Add a photo to boost your profile visibility');
    } else if (percentage < 100) {
        tips.unshift("You're almost there! Complete the remaining fields");
    }

    return {
        percentage,
        completed,
        pending,
        tips: tips.slice(0, 3), // Max 3 tips
    };
};

/**
 * Get user-friendly tip for missing field
 */
const getFieldTip = (field) => {
    const tips = {
        firstName: 'Add your first name',
        lastName: 'Add your last name',
        dateOfBirth: 'Add your date of birth',
        gender: 'Select your gender',
        height: 'Add your height',
        photos: 'Upload at least one photo',
        education: 'Add your education details',
        occupation: 'Add your occupation',
        religion: 'Select your religion',
        country: 'Add your location',
        state: 'Add your state',
        city: 'Add your city',
        bio: 'Write a short bio about yourself',
        partnerExpectations: 'Describe your partner expectations',
    };
    return tips[field] || `Complete ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
};

/**
 * Get profile completion for a user
 * @param {number} userId - User ID
 */
export const getProfileCompletionForUser = async (userId) => {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        include: {
            photos: true,
        },
    });

    if (!profile) {
        return { percentage: 0, completed: [], pending: ['profile'], tips: ['Create your profile to get started'] };
    }

    // Add photos array to profile object
    const profileWithPhotos = {
        ...profile,
        photos: profile.photos || [],
    };

    return calculateProfileCompletion(profileWithPhotos);
};

/**
 * Get completion level badge
 */
export const getCompletionBadge = (percentage) => {
    if (percentage >= 100) return { level: 'COMPLETE', emoji: '🏆', color: '#FFD700' };
    if (percentage >= 80) return { level: 'EXCELLENT', emoji: '⭐', color: '#4CAF50' };
    if (percentage >= 60) return { level: 'GOOD', emoji: '👍', color: '#2196F3' };
    if (percentage >= 40) return { level: 'FAIR', emoji: '📝', color: '#FF9800' };
    return { level: 'INCOMPLETE', emoji: '⚠️', color: '#F44336' };
};

export default {
    calculateProfileCompletion,
    getProfileCompletionForUser,
    getCompletionBadge,
    PROFILE_FIELDS,
};
