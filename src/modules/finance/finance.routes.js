const express = require('express');
const router = express.Router();
const financeController = require('./finance.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { createRecordSchema, updateRecordSchema } = require('./finance.validation');

// All finance routes are protected — you must be logged in
router.use(protect);

/**
 * Read operations — accessible by all authenticated roles:
 *   VIEWER, ANALYST, ADMIN
 *
 * List records supports the following query params:
 *   ?type=INCOME|EXPENSE
 *   ?category=<string>
 *   ?startDate=<ISO date>
 *   ?endDate=<ISO date>
 *   ?page=<number>  (default: 1)
 *   ?limit=<number> (default: 10)
 *   ?sort=-date     (default: newest first; prefix with '-' for descending)
 */
router.get(
  '/',
  restrictTo('ADMIN', 'ANALYST', 'VIEWER'),
  financeController.getRecords
);

router.get(
  '/:id',
  restrictTo('ADMIN', 'ANALYST', 'VIEWER'),
  financeController.getRecordById
);

/**
 * Write operations — ADMIN only.
 * Analysts and Viewers are read-only on this resource.
 *
 * The spec says "admin may be allowed full management access" —
 * enforced here as the primary business rule.
 */
router.post(
  '/',
  restrictTo('ADMIN'),
  validate(createRecordSchema),
  financeController.createRecord
);

router.put(
  '/:id',
  restrictTo('ADMIN'),
  validate(updateRecordSchema),
  financeController.updateRecord
);

// Soft delete — sets isDeleted: true, data is preserved in the DB
router.delete(
  '/:id',
  restrictTo('ADMIN'),
  financeController.deleteRecord
);

module.exports = router;
