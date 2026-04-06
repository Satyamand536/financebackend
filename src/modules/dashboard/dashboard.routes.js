const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middleware');

// All dashboard routes require authentication
router.use(protect);

/**
 * Dashboard Summary — accessible by all authenticated roles.
 * Viewers, Analysts, and Admins can all see the aggregated data.
 *
 * Optional date range filter: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get(
  '/summary',
  restrictTo('ADMIN', 'ANALYST', 'VIEWER'),
  dashboardController.getSummary
);

module.exports = router;
