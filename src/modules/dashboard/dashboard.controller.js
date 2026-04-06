const DashboardService = require('./dashboard.service');
const catchAsync = require('../../core/utils/catchAsync');
const ApiResponse = require('../../core/utils/ApiResponse');

/**
 * GET /api/v1/dashboard/summary
 * Returns a comprehensive analytics summary:
 *   - Overview (totalIncome, totalExpense, netBalance, recordCount)
 *   - Category breakdown by INCOME and EXPENSE
 *   - Monthly trends (all time, or filtered by date range)
 *   - Weekly/daily trends (last 30 days)
 *   - Recent activity (last 5 transactions)
 *
 * Supports optional query params:
 *   ?startDate=2025-01-01
 *   ?endDate=2025-12-31
 */
exports.getSummary = catchAsync(async (req, res) => {
  const summary = await DashboardService.getSummary(req.query);
  res.status(200).json(ApiResponse.success('Dashboard analytics retrieved successfully', summary));
});
