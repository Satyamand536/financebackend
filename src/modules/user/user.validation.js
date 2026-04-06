const Joi = require('joi');

// Schema for updating user profile/role by Admin
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  role: Joi.string().valid('ADMIN', 'ANALYST', 'VIEWER').optional()
}).or('name', 'role'); // At least one field must be provided

// Schema for toggling user active/inactive status
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required()
});

module.exports = {
  updateUserSchema,
  updateStatusSchema
};
