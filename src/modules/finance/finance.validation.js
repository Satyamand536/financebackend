const Joi = require('joi');

// Schema for creating a new financial record
const createRecordSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required'
  }),
  type: Joi.string().valid('INCOME', 'EXPENSE').required().messages({
    'any.only': 'Type must be either INCOME or EXPENSE',
    'any.required': 'Type is required'
  }),
  category: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Category must be at least 2 characters',
    'any.required': 'Category is required'
  }),
  date: Joi.date().iso().required().messages({
    'date.format': 'Date must be in ISO 8601 format (YYYY-MM-DD)',
    'any.required': 'Date is required'
  }),
  note: Joi.string().max(500).optional().allow('', null)
});

// Schema for updating an existing record — all fields optional but at least one required
const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  type: Joi.string().valid('INCOME', 'EXPENSE').optional(),
  category: Joi.string().trim().min(2).max(100).optional(),
  date: Joi.date().iso().optional(),
  note: Joi.string().max(500).optional().allow('', null)
}).min(1); // Enforce at least one field for update

module.exports = {
  createRecordSchema,
  updateRecordSchema
};
