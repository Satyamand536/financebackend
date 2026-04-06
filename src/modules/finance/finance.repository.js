const FinanceRecord = require('./finance.model');

class FinanceRepository {
  async create(data) {
    return await FinanceRecord.create(data);
  }

  async findById(id) {
    return await FinanceRecord.findOne({ _id: id, isDeleted: false });
  }

  async updateById(id, data) {
    return await FinanceRecord.findOneAndUpdate(
      { _id: id, isDeleted: false }, 
      data, 
      { new: true, runValidators: true }
    );
  }

  async findPaginated(filter, page, limit, sortBy = '-date') {
    const skip = (page - 1) * limit;
    
    filter.isDeleted = false; // Always exclude soft-deleted records

    const [docs, total] = await Promise.all([
      FinanceRecord.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role'),
      FinanceRecord.countDocuments(filter)
    ]);

    return {
      docs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async aggregate(pipeline) {
    return await FinanceRecord.aggregate(pipeline);
  }
}

module.exports = new FinanceRepository();
