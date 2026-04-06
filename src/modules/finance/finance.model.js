const mongoose = require('mongoose');

const financeRecordSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  type: { 
    type: String, 
    enum: ['INCOME', 'EXPENSE'], 
    required: [true, 'Type is required (INCOME or EXPENSE)'],
    index: true 
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    index: true 
  },
  date: { 
    type: Date, 
    required: [true, 'Date is required'],
    index: true 
  },
  note: { 
    type: String, 
    maxLength: 500,
    default: null 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  isDeleted: { 
    type: Boolean, 
    default: false, 
    index: true 
  } // Soft delete flag
}, { timestamps: true });

// Compound indexes for highly efficient dashboard aggregate queries
financeRecordSchema.index({ type: 1, date: -1 });
financeRecordSchema.index({ createdBy: 1, date: -1 });

module.exports = mongoose.model('FinanceRecord', financeRecordSchema);
