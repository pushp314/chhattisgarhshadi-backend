import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { reportService } from '../services/report.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Create a new report
 */
export const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.user.id, req.body);
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        report,
        'Report submitted successfully. Our team will review it shortly.'
      )
    );
});

export const reportController = {
  createReport,
};