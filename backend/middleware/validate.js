const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/helpers');

/** Run after a validator chain; short-circuits with 422 on failure. */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array().map((e) => ({ field: e.path, message: e.msg })));
  }
  return next();
}

module.exports = { validate };
