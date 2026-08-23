const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', null, 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_enterprise_netshield_jwt_key_2026');
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'Not authorized, token invalid or expired', null, 401);
  }
};

module.exports = { protect };
