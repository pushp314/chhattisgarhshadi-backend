/**
 * Calculates the profile completeness score based on filled fields.
 * @param {Object} profile - The user's profile object from Prisma.
 * @returns {number} A score between 0 and 100.
 */
export const calculateProfileCompleteness = (profile) => {
  if (!profile) return 0;

  const fields = [
    // Basic Info (20 points)
    { key: 'firstName', weight: 3 },
    { key: 'lastName', weight: 3 },
    { key: 'dateOfBirth', weight: 5 },
    { key: 'gender', weight: 3 },
    { key: 'maritalStatus', weight: 3 },
    { key: 'bio', weight: 3 },

    // Location (10 points)
    { key: 'country', weight: 2 },
    { key: 'state', weight: 2 },
    { key: 'city', weight: 2 },
    { key: 'residencyStatus', weight: 2 },
    { key: 'nativeDistrict', weight: 2 }, // Chhattisgarh-Specific

    // Physical (10 points)
    { key: 'height', weight: 3 },
    { key: 'weight', weight: 2 },
    { key: 'complexion', weight: 2 },
    { key: 'bodyType', weight: 2 },
    { key: 'physicalDisability', weight: 1 }, // Presence of info is what matters

    // Religion & Caste (10 points)
    { key: 'religion', weight: 3 },
    { key: 'caste', weight: 3 },
    { key: 'motherTongue', weight: 2 },
    { key: 'speaksChhattisgarhi', weight: 2 }, // Chhattisgarh-Specific

    // Education & Occupation (15 points)
    { key: 'highestEducation', weight: 3 },
    { key: 'collegeName', weight: 2 },
    { key: 'occupationType', weight: 3 },
    { key: 'occupation', weight: 2 },
    { key: 'companyName', weight: 2 },
    { key: 'annualIncome', weight: 3 },

    // Family Details (15 points)
    { key: 'aboutFamily', weight: 3 },
    { key: 'fatherStatus', weight: 2 },
    { key: 'motherStatus', weight: 2 },
    { key: 'fatherOccupation', weight: 2 },
    { key: 'motherOccupation', weight: 2 },
    { key: 'numberOfBrothers', weight: 1 },
    { key: 'numberOfSisters', weight: 1 },
    { key: 'familyType', weight: 1 },
    { key: 'familyValues', weight: 1 },

    // Lifestyle (10 points)
    { key: 'diet', weight: 3 },
    { key: 'smokingHabit', weight: 3 },
    { key: 'drinkingHabit', weight: 3 },
    { key: 'bloodGroup', weight: 1 },
    
    // Horoscope (5 points)
    { key: 'manglik', weight: 1 },
    { key: 'birthTime', weight: 2 },
    { key: 'birthPlace', weight: 2 },
    
    // Partner Expectations (5 points)
    { key: 'partnerExpectations', weight: 5 },
  ];

  // Total weight = 100
  let score = 0;
  const maxScore = fields.reduce((sum, field) => sum + field.weight, 0); // This should be 100

  fields.forEach(field => {
    const value = profile[field.key];
    
    // Check if value is not null, undefined, or an empty string
    if (value !== null && value !== undefined && value !== '') {
      // Specific checks for booleans where 'false' is also a valid entry
      if (typeof value === 'boolean') {
        score += field.weight;
      } 
      // Specific check for numbers where 0 is a valid entry
      else if (typeof value === 'number' && value >= 0) {
        score += field.weight;
      }
      // General check for strings and other truthy values
      else if (typeof value !== 'boolean' && typeof value !== 'number') {
        score += field.weight;
      }
    }
  });

  // Calculate percentage
  if (maxScore === 0) return 0;
  // Score is now based on a max of 100
  return Math.min(100, Math.floor(score)); 
};

/**
 * Recalculates profile completeness including media.
 * This is a separate function to be called after media changes.
 * @param {object} prisma - The Prisma client instance
 * @param {number} userId - The user's ID.
 */
export const updateProfileCompleteness = async (prisma, userId) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { media: { where: { type: 'PROFILE_PHOTO' } } },
  });

  if (!profile) return;

  // Get base score from fields (max 100)
  let score = calculateProfileCompleteness(profile);

  // Add bonus for profile photo (e.g., 10 points)
  // We'll cap the total score at 100, but this helps users
  // reach 100 if they missed a few minor fields.
  const photoBonus = 10;
  if (profile.media && profile.media.length > 0) {
    score += photoBonus;
  }

  // Final score is capped at 100
  const finalScore = Math.min(100, score); 

  await prisma.profile.update({
    where: { userId },
    data: { profileCompleteness: finalScore },
  });

  return finalScore;
};