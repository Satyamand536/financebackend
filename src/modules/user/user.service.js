const UserRepository = require('./user.repository');
const AppError = require('../../core/errors/AppError');

class UserService {
  /**
   * Returns the currently authenticated user's own profile.
   * Password field is excluded at the model level (select: false).
   */
  async getMe(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  /**
   * Returns a paginated list of all users. Only accessible by ADMIN.
   * Supports optional filtering by status and role via query params.
   */
  async getAllUsers(queryOpts) {
    const { page = 1, limit = 10, status, role } = queryOpts;
    const filter = {};

    if (status) filter.status = status.toUpperCase();
    if (role)   filter.role   = role.toUpperCase();

    return await UserRepository.findPaginated(filter, page, limit);
  }

  /**
   * Get a specific user by ID. Admin only.
   */
  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('No user found with that ID', 404);
    return user;
  }

  /**
   * Update a user's name or role. Admin only.
   * Prevents an Admin from accidentally downgrading themselves if desired,
   * but this logic is explicitly left open per the spec.
   */
  async updateUser(id, updateData) {
    const user = await UserRepository.updateById(id, updateData);
    if (!user) throw new AppError('No user found with that ID', 404);
    return user;
  }

  /**
   * Toggle a user's active/inactive status. Admin only.
   * An admin cannot deactivate their own account to prevent lockout.
   */
  async updateUserStatus(targetUserId, requestingUserId, status) {
    if (targetUserId.toString() === requestingUserId.toString()) {
      throw new AppError('You cannot change your own account status', 400);
    }
    const user = await UserRepository.updateById(targetUserId, { status });
    if (!user) throw new AppError('No user found with that ID', 404);
    return user;
  }
}

module.exports = new UserService();
