const { errorResponse } = require('../utils/helpers');

/** Restricts a route to one or more roles. Use after protect(). */
function requireRole(...roles) {
  return function roleCheck(req, res, next) {
    if (!req.user) {
      return errorResponse(res, 401, 'Not authorized.');
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Forbidden. You do not have permission to access this resource.');
    }
    return next();
  };
}

module.exports = { requireRole };
