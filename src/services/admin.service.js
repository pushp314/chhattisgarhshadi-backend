import prisma from '../config/database.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
// ADDED: Imports for new functions
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  try {
    const [
      totalUsers,
      totalProfiles,
      totalMatches,
      totalMessages,
      totalPayments,
      pendingReports, // ADDED
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.matchRequest.count(), 
      prisma.message.count(),
      prisma.payment.count(), // Corrected from 'payments'
      // ADDED: Count pending reports
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalProfiles,
      totalMatches,
      totalMessages,
      totalPayments,
      pendingReports, // ADDED
    };
  } catch (error) {
    logger.error('Error in getDashboardStats:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve dashboard stats'
    );
  }
};

/**
 * Clean up expired refresh tokens
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    logger.info(`Admin cleanup: ${result.count} expired tokens deleted.`);
    return result.count;
  } catch (error) {
    logger.error('Error in cleanupExpiredTokens:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to clean up tokens'
    );
  }
};

/**
 * Get recent users
 */
const getRecentUsers = async (limit = 10) => {
  try {
    return await prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        profile: true,
      },
    });
  } catch (error) {
    logger.error('Error in getRecentUsers:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve recent users'
    );
  }
};

/**
 * Get recent matches
 */
const getRecentMatches = async (limit = 10) => {
  try {
    return await prisma.matchRequest.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          include: { profile: true },
        },
        receiver: {
          include: { profile: true },
        },
      },
    });
  } catch (error) {
    logger.error('Error in getRecentMatches:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve recent matches'
    );
  }
};

// --- ADDED FOR REPORTS ---

/**
 * [NEW] Get all reports (paginated, filterable)
 * @param {Object} query - Validated query params (page, limit, status)
 * @returns {Promise<Object>} Paginated list of reports
 */
const getReports = async (query) => {
  try {
    const { page, limit, skip } = getPaginationParams(query);
    const { status } = query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true }} } },
          reportedUser: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true }} } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.report.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);
    return { reports, pagination };

  } catch (error) {
    logger.error('Error in getReports:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to retrieve reports');
  }
};

/**
 * [NEW] Get a single report by ID with full details
 * @param {number} reportId - The ID of the report
 * @returns {Promise<Object>} The report object
 */
const getReportById = async (reportId) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: { include: { profile: true } },
        reportedUser: { include: { profile: true } },
      },
    });

    if (!report) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Report not found');
    }

    // Parse the evidence string into an array
    let evidenceArray = [];
    if (report.evidence) {
      try {
        evidenceArray = JSON.parse(report.evidence);
      } catch (e) {
        logger.warn(`Failed to parse evidence JSON for report ${reportId}`);
      }
    }

    return { ...report, evidence: evidenceArray };
  } catch (error) {
    logger.error('Error in getReportById:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to retrieve report');
  }
};

/**
 * [NEW] Update a report's status and add notes
 * @param {number} reportId - The ID of the report
 * @param {Object} data - Validated update data (status, reviewNote, actionTaken)
 * @returns {Promise<Object>} The updated report
 */
const updateReportStatus = async (reportId, data) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Report not found');
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...data,
        reviewedAt: new Date(),
      },
    });

    // TODO: Add logic here to ban the user if status is 'RESOLVED' and action is 'BAN'
    // e.g., if (data.actionTaken === 'BAN_USER') { ... }

    logger.info(`Admin updated report ${reportId} to status ${data.status}`);
    return updatedReport;
  } catch (error) {
    logger.error('Error in updateReportStatus:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to update report');
  }
};

export const adminService = {
  getDashboardStats,
  cleanupExpiredTokens,
  getRecentUsers,
  getRecentMatches,
  getReports,         // ADDED
  getReportById,      // ADDED
  updateReportStatus, // ADDED
};