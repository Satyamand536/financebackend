const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { updateUserSchema, updateStatusSchema } = require('./user.validation');

// All user management routes require authentication
router.use(protect);

// GET /api/v1/users        → List all users (Admin only)
// GET /api/v1/users/me     → Get own profile (any authenticated user)
// GET /api/v1/users/:id    → Get specific user (Admin only)
// PATCH /api/v1/users/:id  → Update user role/name (Admin only)
// PATCH /api/v1/users/:id/status → Toggle active/inactive (Admin only)

router.get('/me', userController.getMe);

router.use(restrictTo('ADMIN')); // Everything below is Admin-only

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id', validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', validate(updateStatusSchema), userController.updateUserStatus);

module.exports = router;
