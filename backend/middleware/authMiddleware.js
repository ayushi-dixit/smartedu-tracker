const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { errorResponse } = require('../utils/helpers');

/** Requires a valid Bearer JWT. Attaches req.user (User doc, no password) and req.profile (Student/Faculty doc, if applicable). */
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return errorResponse(res, 401, 'Not authorized. No token provided.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return errorResponse(res, 401, 'Not authorized. Invalid or expired token.');
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'ACTIVE') {
      return errorResponse(res, 401, 'Not authorized. User no longer active.');
    }

    req.user = user;

    if (user.role === 'STUDENT') {
      req.profile = await Student.findOne({ userId: user._id });
    } else if (user.role === 'FACULTY') {
      req.profile = await Faculty.findOne({ userId: user._id });
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { protect };
