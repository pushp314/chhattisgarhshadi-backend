/**
 * Horoscope Matching Service - Ashtakoot Guna Milan
 * 
 * The Ashtakoot system evaluates 8 aspects (Kootas) for marriage compatibility.
 * Maximum score: 36 Gunas
 * 
 * Score Interpretation:
 * - 0-17: Not recommended
 * - 18-24: Average match, proceed with caution
 * - 25-32: Good match
 * - 33-36: Excellent match
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

// ============================================
// CONSTANTS - Nakshatra and Rashi Mappings
// ============================================

// 27 Nakshatras in order
const NAKSHATRAS = [
    'ASHWINI', 'BHARANI', 'KRITTIKA', 'ROHINI', 'MRIGASHIRA', 'ARDRA',
    'PUNARVASU', 'PUSHYA', 'ASHLESHA', 'MAGHA', 'PURVA_PHALGUNI', 'UTTARA_PHALGUNI',
    'HASTA', 'CHITRA', 'SWATI', 'VISHAKHA', 'ANURADHA', 'JYESHTHA',
    'MULA', 'PURVA_ASHADHA', 'UTTARA_ASHADHA', 'SHRAVANA', 'DHANISHTA', 'SHATABHISHA',
    'PURVA_BHADRAPADA', 'UTTARA_BHADRAPADA', 'REVATI'
];

// 12 Rashis (Zodiac Signs) in order
const RASHIS = [
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'
];

// Nakshatra to Rashi mapping (each nakshatra belongs to a rashi)
const NAKSHATRA_TO_RASHI = {
    ASHWINI: 'ARIES', BHARANI: 'ARIES', KRITTIKA: 'ARIES',
    ROHINI: 'TAURUS', MRIGASHIRA: 'TAURUS',
    ARDRA: 'GEMINI', PUNARVASU: 'GEMINI',
    PUSHYA: 'CANCER', ASHLESHA: 'CANCER',
    MAGHA: 'LEO', PURVA_PHALGUNI: 'LEO',
    UTTARA_PHALGUNI: 'VIRGO', HASTA: 'VIRGO', CHITRA: 'VIRGO',
    SWATI: 'LIBRA', VISHAKHA: 'LIBRA',
    ANURADHA: 'SCORPIO', JYESHTHA: 'SCORPIO',
    MULA: 'SAGITTARIUS', PURVA_ASHADHA: 'SAGITTARIUS',
    UTTARA_ASHADHA: 'CAPRICORN', SHRAVANA: 'CAPRICORN',
    DHANISHTA: 'AQUARIUS', SHATABHISHA: 'AQUARIUS',
    PURVA_BHADRAPADA: 'PISCES', UTTARA_BHADRAPADA: 'PISCES', REVATI: 'PISCES'
};

// Nakshatra to Yoni (Animal) mapping
const NAKSHATRA_TO_YONI = {
    ASHWINI: 'HORSE', SHATABHISHA: 'HORSE',
    BHARANI: 'ELEPHANT', REVATI: 'ELEPHANT',
    KRITTIKA: 'GOAT', PUSHYA: 'GOAT',
    ROHINI: 'SERPENT', MRIGASHIRA: 'SERPENT',
    ARDRA: 'DOG', MULA: 'DOG',
    PUNARVASU: 'CAT', ASHLESHA: 'CAT',
    MAGHA: 'RAT', PURVA_PHALGUNI: 'RAT',
    UTTARA_PHALGUNI: 'COW', UTTARA_BHADRAPADA: 'COW',
    HASTA: 'BUFFALO', SWATI: 'BUFFALO',
    CHITRA: 'TIGER', VISHAKHA: 'TIGER',
    ANURADHA: 'DEER', JYESHTHA: 'DEER',
    PURVA_ASHADHA: 'MONKEY', SHRAVANA: 'MONKEY',
    UTTARA_ASHADHA: 'MONGOOSE', DHANISHTA: 'LION',
    PURVA_BHADRAPADA: 'LION'
};

// Yoni compatibility matrix (0-4 points)
const YONI_COMPATIBILITY = {
    HORSE: { HORSE: 4, ELEPHANT: 2, GOAT: 2, SERPENT: 3, DOG: 2, CAT: 2, RAT: 2, COW: 1, BUFFALO: 0, TIGER: 1, DEER: 3, MONKEY: 2, MONGOOSE: 2, LION: 1 },
    // Simplified - same animal = 4, friendly = 3, neutral = 2, enemy = 0-1
};

// Nadi mapping (3 types)
const NAKSHATRA_TO_NADI = {
    ASHWINI: 'VATA', ARDRA: 'VATA', PUNARVASU: 'VATA', UTTARA_PHALGUNI: 'VATA',
    HASTA: 'VATA', JYESHTHA: 'VATA', MULA: 'VATA', SHATABHISHA: 'VATA', PURVA_BHADRAPADA: 'VATA',

    BHARANI: 'PITTA', MRIGASHIRA: 'PITTA', PUSHYA: 'PITTA', PURVA_PHALGUNI: 'PITTA',
    CHITRA: 'PITTA', ANURADHA: 'PITTA', PURVA_ASHADHA: 'PITTA', DHANISHTA: 'PITTA', UTTARA_BHADRAPADA: 'PITTA',

    KRITTIKA: 'KAPHA', ROHINI: 'KAPHA', ASHLESHA: 'KAPHA', MAGHA: 'KAPHA',
    SWATI: 'KAPHA', VISHAKHA: 'KAPHA', UTTARA_ASHADHA: 'KAPHA', SHRAVANA: 'KAPHA', REVATI: 'KAPHA'
};

// Gana (Temperament) mapping
const NAKSHATRA_TO_GANA = {
    ASHWINI: 'DEVA', MRIGASHIRA: 'DEVA', PUNARVASU: 'DEVA', PUSHYA: 'DEVA',
    HASTA: 'DEVA', SWATI: 'DEVA', ANURADHA: 'DEVA', SHRAVANA: 'DEVA', REVATI: 'DEVA',

    BHARANI: 'MANUSHYA', ROHINI: 'MANUSHYA', ARDRA: 'MANUSHYA', PURVA_PHALGUNI: 'MANUSHYA',
    UTTARA_PHALGUNI: 'MANUSHYA', PURVA_ASHADHA: 'MANUSHYA', UTTARA_ASHADHA: 'MANUSHYA',
    PURVA_BHADRAPADA: 'MANUSHYA', UTTARA_BHADRAPADA: 'MANUSHYA',

    KRITTIKA: 'RAKSHASA', ASHLESHA: 'RAKSHASA', MAGHA: 'RAKSHASA', CHITRA: 'RAKSHASA',
    VISHAKHA: 'RAKSHASA', JYESHTHA: 'RAKSHASA', MULA: 'RAKSHASA', DHANISHTA: 'RAKSHASA', SHATABHISHA: 'RAKSHASA'
};

// ============================================
// KOOTA CALCULATION FUNCTIONS
// ============================================

/**
 * 1. Varna Koota (1 point) - Spiritual compatibility
 */
const calculateVarna = (rashi1, rashi2) => {
    const varnaOrder = {
        'BRAHMIN': ['CANCER', 'SCORPIO', 'PISCES'],
        'KSHATRIYA': ['ARIES', 'LEO', 'SAGITTARIUS'],
        'VAISHYA': ['TAURUS', 'VIRGO', 'CAPRICORN'],
        'SHUDRA': ['GEMINI', 'LIBRA', 'AQUARIUS']
    };

    const getVarnaRank = (rashi) => {
        if (varnaOrder.BRAHMIN.includes(rashi)) return 4;
        if (varnaOrder.KSHATRIYA.includes(rashi)) return 3;
        if (varnaOrder.VAISHYA.includes(rashi)) return 2;
        if (varnaOrder.SHUDRA.includes(rashi)) return 1;
        return 0;
    };

    const rank1 = getVarnaRank(rashi1);
    const rank2 = getVarnaRank(rashi2);

    // Bride's varna should be equal or lower than groom's
    return rank2 >= rank1 ? 1 : 0;
};

/**
 * 2. Vashya Koota (2 points) - Mutual attraction/control
 */
const calculateVashya = (rashi1, rashi2) => {
    const vashyaGroups = {
        'QUADRUPED': ['ARIES', 'TAURUS', 'LEO', 'SAGITTARIUS', 'CAPRICORN'],
        'HUMAN': ['GEMINI', 'VIRGO', 'LIBRA', 'AQUARIUS'],
        'WATER': ['CANCER', 'PISCES'],
        'INSECT': ['SCORPIO']
    };

    const getGroup = (rashi) => {
        for (const [group, rashis] of Object.entries(vashyaGroups)) {
            if (rashis.includes(rashi)) return group;
        }
        return null;
    };

    const group1 = getGroup(rashi1);
    const group2 = getGroup(rashi2);

    if (group1 === group2) return 2;
    if ((group1 === 'QUADRUPED' && group2 === 'HUMAN') ||
        (group1 === 'HUMAN' && group2 === 'QUADRUPED')) return 1;
    return 0;
};

/**
 * 3. Tara Koota (3 points) - Birth star compatibility
 */
const calculateTara = (nakshatra1, nakshatra2) => {
    const idx1 = NAKSHATRAS.indexOf(nakshatra1.toUpperCase());
    const idx2 = NAKSHATRAS.indexOf(nakshatra2.toUpperCase());

    if (idx1 === -1 || idx2 === -1) return 0;

    const diff = ((idx2 - idx1 + 27) % 27) + 1;
    const tara = diff % 9;

    // Auspicious taras: 1, 2, 4, 6, 8 = 3 points; others = 0
    const auspiciousTaras = [1, 2, 4, 6, 8, 0]; // 0 = 9th
    return auspiciousTaras.includes(tara) ? 3 : 0;
};

/**
 * 4. Yoni Koota (4 points) - Physical/sexual compatibility
 */
const calculateYoni = (nakshatra1, nakshatra2) => {
    const yoni1 = NAKSHATRA_TO_YONI[nakshatra1.toUpperCase()];
    const yoni2 = NAKSHATRA_TO_YONI[nakshatra2.toUpperCase()];

    if (!yoni1 || !yoni2) return 0;

    if (yoni1 === yoni2) return 4;

    // Enemies get 0, friends get 3, neutral get 2
    const enemies = {
        'COW': 'TIGER', 'TIGER': 'COW',
        'RAT': 'CAT', 'CAT': 'RAT',
        'HORSE': 'BUFFALO', 'BUFFALO': 'HORSE',
        'DOG': 'DEER', 'DEER': 'DOG',
        'SERPENT': 'MONGOOSE', 'MONGOOSE': 'SERPENT',
        'MONKEY': 'GOAT', 'GOAT': 'MONKEY',
        'LION': 'ELEPHANT', 'ELEPHANT': 'LION'
    };

    if (enemies[yoni1] === yoni2) return 0;
    return 2; // Neutral
};

/**
 * 5. Graha Maitri Koota (5 points) - Mental compatibility
 */
const calculateGrahaMaitri = (rashi1, rashi2) => {
    const lords = {
        'ARIES': 'MARS', 'SCORPIO': 'MARS',
        'TAURUS': 'VENUS', 'LIBRA': 'VENUS',
        'GEMINI': 'MERCURY', 'VIRGO': 'MERCURY',
        'CANCER': 'MOON',
        'LEO': 'SUN',
        'SAGITTARIUS': 'JUPITER', 'PISCES': 'JUPITER',
        'CAPRICORN': 'SATURN', 'AQUARIUS': 'SATURN'
    };

    const friendship = {
        'SUN': { friends: ['MOON', 'MARS', 'JUPITER'], enemies: ['VENUS', 'SATURN'] },
        'MOON': { friends: ['SUN', 'MERCURY'], enemies: [] },
        'MARS': { friends: ['SUN', 'MOON', 'JUPITER'], enemies: ['MERCURY'] },
        'MERCURY': { friends: ['SUN', 'VENUS'], enemies: ['MOON'] },
        'JUPITER': { friends: ['SUN', 'MOON', 'MARS'], enemies: ['MERCURY', 'VENUS'] },
        'VENUS': { friends: ['MERCURY', 'SATURN'], enemies: ['SUN', 'MOON'] },
        'SATURN': { friends: ['MERCURY', 'VENUS'], enemies: ['SUN', 'MOON', 'MARS'] }
    };

    const lord1 = lords[rashi1];
    const lord2 = lords[rashi2];

    if (!lord1 || !lord2) return 0;
    if (lord1 === lord2) return 5;

    const isFriend1 = friendship[lord1]?.friends?.includes(lord2);
    const isFriend2 = friendship[lord2]?.friends?.includes(lord1);
    const isEnemy1 = friendship[lord1]?.enemies?.includes(lord2);
    const isEnemy2 = friendship[lord2]?.enemies?.includes(lord1);

    if (isFriend1 && isFriend2) return 5;
    if (isFriend1 || isFriend2) return 4;
    if (isEnemy1 && isEnemy2) return 0;
    if (isEnemy1 || isEnemy2) return 1;
    return 3; // Neutral
};

/**
 * 6. Gana Koota (6 points) - Temperament matching
 */
const calculateGana = (nakshatra1, nakshatra2) => {
    const gana1 = NAKSHATRA_TO_GANA[nakshatra1.toUpperCase()];
    const gana2 = NAKSHATRA_TO_GANA[nakshatra2.toUpperCase()];

    if (!gana1 || !gana2) return 0;

    if (gana1 === gana2) return 6;
    if ((gana1 === 'DEVA' && gana2 === 'MANUSHYA') ||
        (gana1 === 'MANUSHYA' && gana2 === 'DEVA')) return 5;
    if ((gana1 === 'MANUSHYA' && gana2 === 'RAKSHASA') ||
        (gana1 === 'RAKSHASA' && gana2 === 'MANUSHYA')) return 1;
    return 0; // Deva-Rakshasa = 0
};

/**
 * 7. Bhakoot Koota (7 points) - Family welfare & prosperity
 */
const calculateBhakoot = (rashi1, rashi2) => {
    const idx1 = RASHIS.indexOf(rashi1);
    const idx2 = RASHIS.indexOf(rashi2);

    if (idx1 === -1 || idx2 === -1) return 0;

    const diff = Math.abs(idx2 - idx1);

    // Inauspicious combinations: 2-12, 5-9, 6-8
    const inauspicious = [1, 11, 4, 8, 5, 7]; // 0-indexed

    if (inauspicious.includes(diff)) return 0;
    return 7;
};

/**
 * 8. Nadi Koota (8 points) - Health & genetic compatibility
 * MOST IMPORTANT - same nadi = Nadi Dosha
 */
const calculateNadi = (nakshatra1, nakshatra2) => {
    const nadi1 = NAKSHATRA_TO_NADI[nakshatra1.toUpperCase()];
    const nadi2 = NAKSHATRA_TO_NADI[nakshatra2.toUpperCase()];

    if (!nadi1 || !nadi2) return 0;

    // Same Nadi = Nadi Dosha = 0 points (serious concern)
    if (nadi1 === nadi2) return 0;
    return 8;
};

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

/**
 * Calculate Guna Milan score between two profiles
 * @param {number} profileId1 - First profile ID (typically male)
 * @param {number} profileId2 - Second profile ID (typically female)
 * @returns {Promise<Object>} Detailed compatibility report
 */
export const calculateGunaScore = async (profileId1, profileId2) => {
    try {
        // Fetch both profiles
        const [profile1, profile2] = await Promise.all([
            prisma.profile.findUnique({
                where: { id: profileId1 },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    gender: true,
                    rashi: true,
                    nakshatra: true,
                    manglik: true,
                    dateOfBirth: true,
                },
            }),
            prisma.profile.findUnique({
                where: { id: profileId2 },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    gender: true,
                    rashi: true,
                    nakshatra: true,
                    manglik: true,
                    dateOfBirth: true,
                },
            }),
        ]);

        if (!profile1 || !profile2) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, 'One or both profiles not found');
        }

        // Check if horoscope data is available
        const hasHoroscopeData1 = profile1.rashi && profile1.nakshatra;
        const hasHoroscopeData2 = profile2.rashi && profile2.nakshatra;

        if (!hasHoroscopeData1 || !hasHoroscopeData2) {
            return {
                canCalculate: false,
                message: 'Horoscope data (Rashi and Nakshatra) is required for both profiles',
                missingData: {
                    profile1: !hasHoroscopeData1 ? ['rashi', 'nakshatra'] : [],
                    profile2: !hasHoroscopeData2 ? ['rashi', 'nakshatra'] : [],
                },
            };
        }

        const rashi1 = profile1.rashi.toUpperCase();
        const rashi2 = profile2.rashi.toUpperCase();
        const nakshatra1 = profile1.nakshatra.toUpperCase().replace(/\s+/g, '_');
        const nakshatra2 = profile2.nakshatra.toUpperCase().replace(/\s+/g, '_');

        // Calculate all 8 Kootas
        const kootas = {
            varna: { score: calculateVarna(rashi1, rashi2), maxScore: 1, name: 'Varna' },
            vashya: { score: calculateVashya(rashi1, rashi2), maxScore: 2, name: 'Vashya' },
            tara: { score: calculateTara(nakshatra1, nakshatra2), maxScore: 3, name: 'Tara' },
            yoni: { score: calculateYoni(nakshatra1, nakshatra2), maxScore: 4, name: 'Yoni' },
            grahaMaitri: { score: calculateGrahaMaitri(rashi1, rashi2), maxScore: 5, name: 'Graha Maitri' },
            gana: { score: calculateGana(nakshatra1, nakshatra2), maxScore: 6, name: 'Gana' },
            bhakoot: { score: calculateBhakoot(rashi1, rashi2), maxScore: 7, name: 'Bhakoot' },
            nadi: { score: calculateNadi(nakshatra1, nakshatra2), maxScore: 8, name: 'Nadi' },
        };

        // Calculate total score
        const totalScore = Object.values(kootas).reduce((sum, k) => sum + k.score, 0);
        const maxScore = 36;
        const percentage = Math.round((totalScore / maxScore) * 100);

        // Determine compatibility level
        let compatibilityLevel;
        let recommendation;
        if (totalScore >= 33) {
            compatibilityLevel = 'EXCELLENT';
            recommendation = 'Highly compatible match. Proceed with confidence.';
        } else if (totalScore >= 25) {
            compatibilityLevel = 'GOOD';
            recommendation = 'Good compatibility. A favorable match.';
        } else if (totalScore >= 18) {
            compatibilityLevel = 'AVERAGE';
            recommendation = 'Average compatibility. Consider other factors.';
        } else {
            compatibilityLevel = 'LOW';
            recommendation = 'Low compatibility. Careful consideration advised.';
        }

        // Check for Doshas
        const doshas = [];
        if (kootas.nadi.score === 0) {
            doshas.push({
                type: 'NADI_DOSHA',
                severity: 'HIGH',
                description: 'Same Nadi detected. This may indicate health concerns for offspring.',
            });
        }

        // Check Manglik compatibility
        if (profile1.manglik !== profile2.manglik && (profile1.manglik || profile2.manglik)) {
            doshas.push({
                type: 'MANGLIK_DOSHA',
                severity: 'MEDIUM',
                description: 'One partner is Manglik while the other is not. Remedies may be needed.',
            });
        }

        logger.info(`Guna Milan calculated: ${profile1.id} ↔ ${profile2.id} = ${totalScore}/36`);

        return {
            canCalculate: true,
            profiles: {
                profile1: {
                    id: profile1.id,
                    name: `${profile1.firstName} ${profile1.lastName || ''}`.trim(),
                    rashi: profile1.rashi,
                    nakshatra: profile1.nakshatra,
                    manglik: profile1.manglik,
                },
                profile2: {
                    id: profile2.id,
                    name: `${profile2.firstName} ${profile2.lastName || ''}`.trim(),
                    rashi: profile2.rashi,
                    nakshatra: profile2.nakshatra,
                    manglik: profile2.manglik,
                },
            },
            result: {
                totalScore,
                maxScore,
                percentage,
                compatibilityLevel,
                recommendation,
            },
            kootas,
            doshas,
        };
    } catch (error) {
        logger.error('Error in calculateGunaScore:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Error calculating horoscope compatibility'
        );
    }
};

/**
 * Get horoscope match for current user with another profile
 * @param {number} userId - Current user's ID
 * @param {number} targetProfileId - Target profile ID to match against
 * @returns {Promise<Object>} Compatibility result
 */
export const getHoroscopeMatch = async (userId, targetProfileId) => {
    try {
        // Get current user's profile
        const currentProfile = await prisma.profile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!currentProfile) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Your profile not found');
        }

        return await calculateGunaScore(currentProfile.id, targetProfileId);
    } catch (error) {
        logger.error('Error in getHoroscopeMatch:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Error getting horoscope match'
        );
    }
};

export const horoscopeService = {
    calculateGunaScore,
    getHoroscopeMatch,
};
