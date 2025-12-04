import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { horoscopeService } from '../services/horoscope.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get horoscope compatibility with another profile
 */
export const getHoroscopeMatch = asyncHandler(async (req, res) => {
    const result = await horoscopeService.getHoroscopeMatch(
        req.user.id,
        parseInt(req.params.profileId)
    );
    res
        .status(HTTP_STATUS.OK)
        .json(
            new ApiResponse(
                HTTP_STATUS.OK,
                result,
                'Horoscope compatibility calculated'
            )
        );
});

/**
 * Calculate Guna Milan between two profiles (Admin or direct comparison)
 */
export const calculateGunaScore = asyncHandler(async (req, res) => {
    const { profileId1, profileId2 } = req.body;
    const result = await horoscopeService.calculateGunaScore(profileId1, profileId2);
    res
        .status(HTTP_STATUS.OK)
        .json(
            new ApiResponse(
                HTTP_STATUS.OK,
                result,
                'Guna Milan score calculated'
            )
        );
});

export const horoscopeController = {
    getHoroscopeMatch,
    calculateGunaScore,
};
