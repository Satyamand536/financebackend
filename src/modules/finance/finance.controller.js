const FinanceService = require('./finance.service');
const catchAsync = require('../../core/utils/catchAsync');
const ApiResponse = require('../../core/utils/ApiResponse');

exports.createRecord = catchAsync(async (req, res) => {
  const record = await FinanceService.createRecord(req.body, req.user._id);
  res.status(201).json(ApiResponse.success('Record created successfully', record, 201));
});

exports.getRecords = catchAsync(async (req, res) => {
  const result = await FinanceService.getRecords(req.query, req.user.role, req.user._id);
  res.status(200).json(ApiResponse.success('Records fetched', result));
});

exports.getRecordById = catchAsync(async (req, res) => {
  const record = await FinanceService.getRecordById(req.params.id);
  res.status(200).json(ApiResponse.success('Record fetched', record));
});

exports.updateRecord = catchAsync(async (req, res) => {
  const record = await FinanceService.updateRecord(req.params.id, req.body);
  res.status(200).json(ApiResponse.success('Record updated effectively', record));
});

exports.deleteRecord = catchAsync(async (req, res) => {
  await FinanceService.deleteRecord(req.params.id);
  res.status(200).json(ApiResponse.success('Record deleted successfully'));
});
