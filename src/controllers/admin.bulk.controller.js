import xlsx from 'xlsx';
import { prisma } from '../server.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

// Helper to parse Excel date
const parseExcelDate = (serial) => {
    if (!serial) return null;
    // If it's already a string like "1990-01-01"
    if (typeof serial === 'string') return new Date(serial);
    // Excel date serial number
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
};

class AdminBulkController {

    uploadUsers = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No file uploaded");
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Excel sheet is empty");
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Process sequentially to avoid race conditions or overwhelming DB
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // Excel row number (1-based, header is 1)

            try {
                // Validation - Basic Required Fields
                if (!row.email || !row.firstName || !row.lastName || !row.gender || !row.dateOfBirth) {
                    throw new Error("Missing required fields (email, firstName, lastName, gender, dateOfBirth)");
                }

                const email = row.email.trim().toLowerCase();

                // Check for existing user
                const existingUser = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: email },
                            { googleId: `admin_import_${email}` } // Check our generated ID too
                        ]
                    }
                });

                if (existingUser) {
                    throw new Error(`User with email ${email} already exists`);
                }

                // Create User and Profile in Transaction
                await prisma.$transaction(async (tx) => {
                    // 1. Create User
                    const newUser = await tx.user.create({
                        data: {
                            email: email,
                            googleId: `admin_import_${email}`, // Generated Placeholder ID
                            authProvider: 'GOOGLE', // Constraint
                            role: 'USER',
                            isEmailVerified: true, // Trusted admin source
                            isActive: true,
                            phone: row.phone ? String(row.phone) : undefined,

                            // Create Profile
                            profile: {
                                create: {
                                    firstName: row.firstName,
                                    lastName: row.lastName,
                                    dateOfBirth: parseExcelDate(row.dateOfBirth),
                                    gender: row.gender.toUpperCase(), // Enum: MALE, FEMALE
                                    maritalStatus: row.maritalStatus ? row.maritalStatus.toUpperCase() : 'NEVER_MARRIED',
                                    religion: row.religion ? row.religion.toUpperCase() : 'OTHER',
                                    motherTongue: row.motherTongue ? row.motherTongue.toUpperCase() : 'HINDI',
                                    country: row.country || 'India',
                                    state: row.state || 'Chhattisgarh',
                                    city: row.city || 'Raipur',

                                    // Optional Fields
                                    caste: row.caste,
                                    height: row.height ? parseInt(row.height) : undefined,
                                    highestEducation: row.education,
                                    occupation: row.occupation,
                                    annualIncome: row.annualIncome ? String(row.annualIncome) : undefined,

                                    // Defaults
                                    profilePrivacySettings: { create: {} },
                                    partnerPreference: { create: {} }
                                }
                            }
                        }
                    });
                });

                results.success++;

            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: rowNumber,
                    email: row.email || 'N/A',
                    error: error.message
                });
            }
        }

        return res.status(HTTP_STATUS.OK).json(
            new ApiResponse(HTTP_STATUS.OK, results, `Processed ${rows.length} rows`)
        );
    });
}

export const adminBulkController = new AdminBulkController();
