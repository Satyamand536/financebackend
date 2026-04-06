const jwt = require('jsonwebtoken');
const UserRepository = require('../user/user.repository');
const AppError = require('../../core/errors/AppError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      user
    }
  });
};

class AuthService {
  async register(userData, res) {
    // Check if user exists
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email is already in use', 400);
    }

    const newUser = await UserRepository.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'VIEWER'
    });

    createSendToken(newUser, 201, res, 'User registered successfully');
  }

  async login(email, password, res) {
    // 1) Check if email and password exist (handled by joi but double check)
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // 2) Check if user exists && password is correct
    const user = await UserRepository.findByEmail(email, true);
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    // 3) Check if user is active
    if (user.status === 'INACTIVE') {
      throw new AppError('Account deactivated', 401);
    }

    // 4) If everything is ok, send token to client
    createSendToken(user, 200, res, 'Login successful');
  }
}

module.exports = new AuthService();
