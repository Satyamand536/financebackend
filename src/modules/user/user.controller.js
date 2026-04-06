const UserService = require('./user.service');
const catchAsync = require('../../core/utils/catchAsync');
const ApiResponse = require('../../core/utils/ApiResponse');

/**
 * GET /api/v1/users/me
 * Returns the currently authenticated user's own profile data.
 */
exports.getMe = catchAsync(async (req, res) => {
  const user = await UserService.getMe(req.user._id);
  res.status(200).json(ApiResponse.success('Profile retrieved successfully', user));
});

/**
 * GET /api/v1/users
 * Admin only. Returns a paginated list of all users with optional filters.
 */
exports.getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsers(req.query);
  res.status(200).json(ApiResponse.success('Users retrieved successfully', result));
});

/**
 * GET /api/v1/users/:id
 * Admin only. Returns a single user by their MongoDB ObjectId.
 */
exports.getUserById = catchAsync(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  res.status(200).json(ApiResponse.success('User retrieved successfully', user));
});

/**
 * PATCH /api/v1/users/:id
 * Admin only. Updates a user's name and/or role.
 */
exports.updateUser = catchAsync(async (req, res) => {
  const user = await UserService.updateUser(req.params.id, req.body);
  res.status(200).json(ApiResponse.success('User updated successfully', user));
});

/**
 * PATCH /api/v1/users/:id/status
 * Admin only. Activates or deactivates a user account.
 */
exports.updateUserStatus = catchAsync(async (req, res) => {
  const user = await UserService.updateUserStatus(
    req.params.id,
    req.user._id,
    req.body.status
  );
  res.status(200).json(ApiResponse.success(`User account ${req.body.status.toLowerCase()}d successfully`, user));
});
