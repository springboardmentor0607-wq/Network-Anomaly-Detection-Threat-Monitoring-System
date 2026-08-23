const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return sendSuccess(res, 'User registered successfully', result, 201);
  } catch (error) {
    return sendError(res, error.message, null, 400);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return sendSuccess(res, 'User logged in successfully', result, 200);
  } catch (error) {
    return sendError(res, error.message, null, 401);
  }
};

const getMe = async (req, res) => {
  return sendSuccess(res, 'Current user retrieved', { user: req.user });
};

module.exports = {
  register,
  login,
  getMe
};
