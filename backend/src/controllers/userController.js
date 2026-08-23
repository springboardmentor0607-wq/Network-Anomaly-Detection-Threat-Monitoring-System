const userService = require('../services/userService');
const { sendSuccess } = require('../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    return sendSuccess(res, 'User list retrieved', users);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return sendSuccess(res, 'User created successfully', user, 201);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, 'User updated successfully', user);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await userService.getAuditLogs();
    return sendSuccess(res, 'Audit logs retrieved', logs);
  } catch (error) {
    next(error);
  }
};

const getTeams = async (req, res, next) => {
  try {
    const teams = await userService.getTeams();
    return sendSuccess(res, 'Teams list retrieved', teams);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs,
  getTeams
};
