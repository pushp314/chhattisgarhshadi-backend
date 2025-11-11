/**
 * Calculates the profile completeness score based on filled fields.
 * @param {Object} profile - The user's profile object from Prisma.
 * @returns {number} A score between 0 and 100.
 */
export const calculateProfileCompleteness = (profile) => {
  if (!profile) return 0;

  const fields = [
    { key: 'firstName', weight: 5 },
    { key: 'lastName', weight: 5 },
    { key: 'dateOfBirth', weight: 10 },
    { key: 'gender', weight: 5 },
    { key: 'maritalStatus', weight: 5 },
    { key: 'religion', weight: 5 },
    { key: 'caste', weight: 5 },
    { key: 'motherTongue', weight: 5 },
    { key: 'height', weight: 5 },
    { key: 'country', weight: 2 },
    { key: 'state', weight: 3 },
    { key: 'city', weight: 5 },
    { key: 'bio', weight: 10 },
    { key: 'highestEducation', weight: 5 },
    { key: 'occupation', weight: 5 },
    { key: 'annualIncome', weight: 5 },
    { key: 'fatherName', weight: 2 },
    { key: 'motherName', weight: 2 },
    { key: 'aboutFamily', weight: 5 },
    { key: 'nativeDistrict', weight: 3 },
    { key: 'speaksChhattisgarhi', weight: 3 },
    // media[] is not on the profile object, it's a relation.
    // We should check for media separately.
  ];

  let score = 0;
  const maxScore = fields.reduce((sum, field) => sum + field.weight, 0);

  fields.forEach(field => {
    const value = profile[field.key];
    if (value !== null && value !== undefined && value !== '') {
      // Specific check for boolean 'speaksChhattisgarhi'
      if (field.key === 'speaksChhattisgarhi' && value === true) {
        score += field.weight;
      } else if (field.key !== 'speaksChhattisgarhi') {
        score += field.weight;
      }
    }
  });

  // Calculate percentage
  if (maxScore === 0) return 0;
  return Math.min(100, Math.floor((score / maxScore) * 100));
};

/**
 * Recalculates profile completeness including media.
 * This is a separate function to be called after media changes.
 * @param {string} userId - The user's ID.
 */
export const updateProfileCompleteness = async (prisma, userId) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { media: { where: { type: 'PROFILE_PHOTO' } } },
  });

  if (!profile) return;

  let score = calculateProfileCompleteness(profile);

  // Add bonus for profile photo
  if (profile.media && profile.media.length > 0) {
    score += 10; // Add 10 points for having at least one profile photo
  }

  const finalScore = Math.min(100, score);

  await prisma.profile.update({
    where: { userId },
    data: { profileCompleteness: finalScore },
  });

  return finalScore;
};