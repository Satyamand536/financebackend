const AuthService = require('./auth.service');
const catchAsync = require('../../core/utils/catchAsync');

exports.register = catchAsync(async (req, res) => {
  await AuthService.register(req.body, res);
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  await AuthService.login(email, password, res);
});
