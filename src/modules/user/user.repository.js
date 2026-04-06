const User = require('./user.model');

class UserRepository {
  async findByEmail(email, selectPassword = false) {
    let query = User.findOne({ email });
    if (selectPassword) {
      query = query.select('+password');
    }
    return await query;
  }

  async findById(id) {
    return await User.findById(id);
  }

  async create(userData) {
    return await User.create(userData);
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
  }

  async findPaginated(filter, page, limit) {
    const skip = (page - 1) * limit;
    
    const [docs, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).select('-password'),
      User.countDocuments(filter)
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
}

module.exports = new UserRepository();
