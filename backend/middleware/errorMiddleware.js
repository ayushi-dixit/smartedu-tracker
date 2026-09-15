const { errorResponse } = require('../utils/helpers');

function notFound(req, res, next) {
  return errorResponse(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  } else if (statusCode >= 500) {
    console.error('[error]', err.message);
  }

  const message = statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Something went wrong.';

  return errorResponse(res, statusCode, message, err.errors || null);
}

module.exports = { notFound, errorHandler };
