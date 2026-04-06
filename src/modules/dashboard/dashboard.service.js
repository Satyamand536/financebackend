const FinanceRepository = require('../finance/finance.repository');

class DashboardService {
  /**
   * Returns a comprehensive summary of all financial data.
   * Designed to power a frontend dashboard with a single API call.
   *
   * Optionally accepts query params:
   *  ?startDate=<ISO date>
   *  ?endDate=<ISO date>
   *
   * All aggregations run in parallel (Promise.all) for maximum performance.
   */
  async getSummary(queryOpts = {}) {
    const { startDate, endDate } = queryOpts;

    // Build the base match stage used across all aggregation pipelines
    const baseMatch = { isDeleted: false };
    if (startDate || endDate) {
      baseMatch.date = {};
      if (startDate) baseMatch.date.$gte = new Date(startDate);
      if (endDate)   baseMatch.date.$lte = new Date(endDate);
    }

    // Run all analytics queries concurrently — no sequential waterfalling
    const [
      overallTotals,
      categoryBreakdown,
      monthlyTrends,
      weeklyTrends,
      recentResult
    ] = await Promise.all([
      this._getOverallTotals(baseMatch),
      this._getCategoryBreakdown(baseMatch),
      this._getMonthlyTrends(baseMatch),
      this._getWeeklyTrends(baseMatch),
      FinanceRepository.findPaginated({ isDeleted: false }, 1, 5, '-date')
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    overallTotals.forEach(item => {
      if (item._id === 'INCOME')  totalIncome  = item.total;
      if (item._id === 'EXPENSE') totalExpense = item.total;
    });

    return {
      overview: {
        totalIncome,
        totalExpense,
        netBalance: parseFloat((totalIncome - totalExpense).toFixed(2)),
        recordCount: overallTotals.reduce((acc, i) => acc + i.count, 0)
      },
      categoryBreakdown,
      monthlyTrends: this._formatMonthlyTrends(monthlyTrends),
      weeklyTrends,
      recentActivity: recentResult.docs
    };
  }

  /**
   * Aggregates total income and expense amounts plus record counts.
   */
  _getOverallTotals(matchStage) {
    return FinanceRepository.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
  }

  /**
   * Breaks down totals by category for both INCOME and EXPENSE types.
   * Sorted by the highest total first so the frontend can render a
   * ranking chart without additional sorting.
   */
  _getCategoryBreakdown(matchStage) {
    return FinanceRepository.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          type: '$_id.type',
          total: 1,
          count: 1
        }
      },
      { $sort: { total: -1 } }
    ]);
  }

  /**
   * Aggregates monthly totals for each type over all time (or filtered range).
   * Returns raw Mongo output that is reformatted by _formatMonthlyTrends.
   */
  _getMonthlyTrends(matchStage) {
    return FinanceRepository.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year:  { $year:  '$date' },
            month: { $month: '$date' },
            type:  '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
  }

  /**
   * Aggregates daily totals for the last 30 days.
   * Useful for a weekly/daily trend chart on the dashboard.
   */
  _getWeeklyTrends(matchStage) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const weeklyMatch = {
      ...matchStage,
      date: { ...(matchStage.date || {}), $gte: thirtyDaysAgo }
    };

    return FinanceRepository.aggregate([
      { $match: weeklyMatch },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          type: '$_id.type',
          total: 1
        }
      },
      { $sort: { date: 1 } }
    ]);
  }

  /**
   * Transforms the raw monthly aggregation output into a clean,
   * frontend-friendly structure grouped by "YYYY-MM" period keys.
   *
   * Output format:
   * [
   *   { period: "2025-01", income: 5000, expense: 2000 },
   *   { period: "2025-02", income: 6500, expense: 3100 },
   *   ...
   * ]
   */
  _formatMonthlyTrends(rawTrends) {
    const trendMap = {};

    rawTrends.forEach(item => {
      const { year, month, type } = item._id;
      // Zero-pad month for proper chronological string sorting
      const period = `${year}-${String(month).padStart(2, '0')}`;

      if (!trendMap[period]) {
        trendMap[period] = { period, income: 0, expense: 0 };
      }

      if (type === 'INCOME')  trendMap[period].income  = item.total;
      if (type === 'EXPENSE') trendMap[period].expense = item.total;
    });

    // Sort by period string ascending
    return Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period));
  }
}

module.exports = new DashboardService();
