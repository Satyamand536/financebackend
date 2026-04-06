const FinanceRepository = require('./finance.repository');
const AppError = require('../../core/errors/AppError');

class FinanceService {
  async createRecord(payload, userId) {
    return await FinanceRepository.create({ ...payload, createdBy: userId });
  }

  async getRecords(queryOpts, userRole, userId) {
    const { page = 1, limit = 10, type, category, startDate, endDate, sort } = queryOpts;
    const filter = {};

    // Role Based Filtering: If Analyst or Viewer, they might only see their own, or all. 
    // Assuming requirement: Analyst sees all records. Let's make everyone see all if ADMIN/ANALYST.
    // If we wanted user-specific isolation: 
    // if(userRole !== 'ADMIN' && userRole !== 'ANALYST') filter.createdBy = userId;

    if (type) filter.type = type;
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    return await FinanceRepository.findPaginated(filter, page, limit, sort);
  }

  async getRecordById(id) {
    const record = await FinanceRepository.findById(id);
    if (!record) throw new AppError('Record not found', 404);
    return record;
  }

  async updateRecord(id, updateData) {
    const record = await FinanceRepository.updateById(id, updateData);
    if (!record) throw new AppError('Record not found', 404);
    return record;
  }

  async deleteRecord(id) {
    // Soft Delete
    const record = await FinanceRepository.updateById(id, { isDeleted: true });
    if (!record) throw new AppError('Record not found', 404);
    return record;
  }
}

module.exports = new FinanceService();
