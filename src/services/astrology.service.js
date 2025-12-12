/**
 * Astrology Matching Service
 * Kundli/Horoscope matching based on Ashtakoot system
 * Traditional 36 guna matching used in Hindu marriages
 */

import prisma from '../config/database.js';

// Nakshatra (Birth Star) list
const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Rashi (Moon Sign) list
const RASHIS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// Ashtakoot Guna matching values
const ASHTAKOOT_MAX = {
    varna: 1,      // Caste/Spiritual
    vashya: 2,     // Dominance
    tara: 3,       // Destiny
    yoni: 4,       // Nature
    graha: 5,      // Planetary
    gana: 6,       // Temperament
    bhakoot: 7,    // Love
    nadi: 8,       // Health
};

const TOTAL_GUNAS = 36;

/**
 * Calculate Ashtakoot Guna matching score
 * @param {object} profile1 - First profile with horoscope data
 * @param {object} profile2 - Second profile with horoscope data
 * @returns {{ score: number, maxScore: number, percentage: number, breakdown: object, recommendation: string }}
 */
export const calculateGunaMatch = (profile1, profile2) => {
    // Basic validation
    if (!profile1?.nakshatra || !profile2?.nakshatra) {
        return {
            score: 0,
            maxScore: TOTAL_GUNAS,
            percentage: 0,
            breakdown: {},
            recommendation: 'Horoscope details not available',
            canMatch: null,
        };
    }

    const nakshatra1 = NAKSHATRAS.indexOf(profile1.nakshatra);
    const nakshatra2 = NAKSHATRAS.indexOf(profile2.nakshatra);
    const rashi1 = RASHIS.indexOf(profile1.rashi);
    const rashi2 = RASHIS.indexOf(profile2.rashi);

    // Calculate each koot
    const breakdown = {
        varna: calculateVarna(nakshatra1, nakshatra2),
        vashya: calculateVashya(rashi1, rashi2),
        tara: calculateTara(nakshatra1, nakshatra2),
        yoni: calculateYoni(nakshatra1, nakshatra2),
        graha: calculateGraha(rashi1, rashi2),
        gana: calculateGana(nakshatra1, nakshatra2),
        bhakoot: calculateBhakoot(rashi1, rashi2),
        nadi: calculateNadi(nakshatra1, nakshatra2),
    };

    const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    const percentage = Math.round((score / TOTAL_GUNAS) * 100);

    return {
        score,
        maxScore: TOTAL_GUNAS,
        percentage,
        breakdown: formatBreakdown(breakdown),
        recommendation: getRecommendation(score),
        canMatch: score >= 18, // Minimum 18 gunas for good match
        manglikStatus: getManglikCompatibility(profile1.manglik, profile2.manglik),
    };
};

// Individual Koot calculations (simplified versions)
const calculateVarna = (n1, n2) => {
    const varna1 = Math.floor(n1 / 7) % 4;
    const varna2 = Math.floor(n2 / 7) % 4;
    return varna1 >= varna2 ? 1 : 0;
};

const calculateVashya = (r1, r2) => {
    const vashyaGroups = [[0, 4], [1, 9], [2, 5, 10], [3, 7], [6, 11], [5, 8]];
    for (const group of vashyaGroups) {
        if (group.includes(r1) && group.includes(r2)) return 2;
    }
    return 1;
};

const calculateTara = (n1, n2) => {
    const diff = Math.abs(n2 - n1) % 9;
    const goodTaras = [1, 2, 4, 6, 8];
    return goodTaras.includes(diff) ? 3 : 1.5;
};

const calculateYoni = (n1, n2) => {
    const yoniAnimal = n => Math.floor(n / 2) % 14;
    return yoniAnimal(n1) === yoniAnimal(n2) ? 4 : 2;
};

const calculateGraha = (r1, r2) => {
    const lords = [4, 1, 2, 3, 0, 2, 1, 4, 5, 6, 6, 5]; // Planet rulers
    const l1 = lords[r1], l2 = lords[r2];
    if (l1 === l2) return 5;
    if (Math.abs(l1 - l2) <= 1) return 4;
    return 2;
};

const calculateGana = (n1, n2) => {
    const gana = n => Math.floor(n / 9) % 3; // 0=Deva, 1=Manushya, 2=Rakshasa
    const g1 = gana(n1), g2 = gana(n2);
    if (g1 === g2) return 6;
    if (g1 === 2 || g2 === 2) return 0; // Rakshasa doesn't match well
    return 3;
};

const calculateBhakoot = (r1, r2) => {
    const diff = Math.abs(r2 - r1) + 1;
    const badBhakoot = [2, 6, 8, 12];
    return badBhakoot.includes(diff) || badBhakoot.includes(13 - diff) ? 0 : 7;
};

const calculateNadi = (n1, n2) => {
    const nadi = n => Math.floor(n / 9) % 3; // 0=Aadi, 1=Madhya, 2=Antya
    return nadi(n1) !== nadi(n2) ? 8 : 0;
};

/**
 * Format breakdown for display
 */
const formatBreakdown = (breakdown) => {
    return Object.entries(breakdown).map(([koot, score]) => ({
        name: koot.charAt(0).toUpperCase() + koot.slice(1),
        score,
        maxScore: ASHTAKOOT_MAX[koot],
        percentage: Math.round((score / ASHTAKOOT_MAX[koot]) * 100),
    }));
};

/**
 * Get recommendation based on score
 */
const getRecommendation = (score) => {
    if (score >= 32) return '💚 Excellent Match! Highly recommended.';
    if (score >= 25) return '💙 Very Good Match. Proceed with confidence.';
    if (score >= 18) return '💛 Good Match. Compatible for marriage.';
    if (score >= 12) return '🧡 Average Match. Consider other factors.';
    return '❤️ Low Match. Seek astrologer advice.';
};

/**
 * Check Manglik compatibility
 */
const getManglikCompatibility = (manglik1, manglik2) => {
    if (manglik1 === null || manglik2 === null) {
        return { compatible: null, message: 'Manglik status not available' };
    }

    if (manglik1 === manglik2) {
        return { compatible: true, message: manglik1 ? 'Both are Manglik - Compatible' : 'Both are Non-Manglik - Compatible' };
    }

    return { compatible: false, message: 'One is Manglik - Seek remedy advice' };
};

/**
 * Get horoscope compatibility for two users
 */
export const getCompatibility = async (userId1, userId2) => {
    const [profile1, profile2] = await Promise.all([
        prisma.profile.findUnique({ where: { userId: userId1 } }),
        prisma.profile.findUnique({ where: { userId: userId2 } }),
    ]);

    return calculateGunaMatch(profile1, profile2);
};

/**
 * Get Nakshatra list for selection
 */
export const getNakshatras = () => NAKSHATRAS;

/**
 * Get Rashi list for selection
 */
export const getRashis = () => RASHIS;

export default {
    calculateGunaMatch,
    getCompatibility,
    getNakshatras,
    getRashis,
    NAKSHATRAS,
    RASHIS,
};
