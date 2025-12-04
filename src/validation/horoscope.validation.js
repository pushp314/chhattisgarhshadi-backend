import { z } from 'zod';

// Schema for getting horoscope match with a profile
export const getHoroscopeMatchSchema = z.object({
    params: z.object({
        profileId: z.coerce
            .number({ invalid_type_error: 'Profile ID must be a number' })
            .int()
            .positive('Profile ID must be a positive integer'),
    }),
});

// Schema for calculating Guna score between two profiles
export const calculateGunaScoreSchema = z.object({
    body: z.object({
        profileId1: z.coerce
            .number({ invalid_type_error: 'Profile ID 1 must be a number' })
            .int()
            .positive('Profile ID 1 must be a positive integer'),
        profileId2: z.coerce
            .number({ invalid_type_error: 'Profile ID 2 must be a number' })
            .int()
            .positive('Profile ID 2 must be a positive integer'),
    }),
});
