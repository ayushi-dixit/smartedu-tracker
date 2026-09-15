const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { successResponse, errorResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { logAction } = require('../services/auditService');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
  };
}

/**
 * Self-service registration is intentionally limited to STUDENT accounts
 * so the public register endpoint cannot be used to mint FACULTY/ADMIN
 * access. Faculty and admin accounts are created by an existing admin
 * via /api/admin/users (see adminController).
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, studentId, course, semester, section } = req.body;

  if (req.body.role && req.body.role !== 'STUDENT') {
    throw new ApiError(403, 'Only student self-registration is allowed here. Ask an admin to create faculty/admin accounts.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  if (!studentId) throw new ApiError(422, 'studentId is required for student registration.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: email.toLowerCase(), passwordHash, role: 'STUDENT', status: 'ACTIVE' });

  const student = await Student.create({
    userId: user._id,
    studentId,
    fullName,
    email: email.toLowerCase(),
    course: course || 'MCA',
    semester: semester || 1,
    section: section || '',
  });

  await logAction({ userId: user._id, action: 'REGISTER', targetType: 'User', targetId: user._id });

  const token = signToken(user);
  return successResponse(res, 201, 'Registration successful', { token, user: sanitizeUser(user), profile: student });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  if (user.status !== 'ACTIVE') throw new ApiError(403, 'This account has been disabled. Contact an administrator.');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password.');

  let profile = null;
  if (user.role === 'STUDENT') profile = await Student.findOne({ userId: user._id });
  else if (user.role === 'FACULTY') profile = await Faculty.findOne({ userId: user._id });

  await logAction({ userId: user._id, action: 'LOGIN', targetType: 'User', targetId: user._id });

  const token = signToken(user);
  return successResponse(res, 200, 'Login successful', { token, user: sanitizeUser(user), profile });
});

const me = asyncHandler(async (req, res) => {
  return successResponse(res, 200, 'Current user', { user: sanitizeUser(req.user), profile: req.profile || null });
});

/** Stateless JWT — logout is a client-side token discard; this endpoint exists for auditing/symmetry with the spec. */
const logout = asyncHandler(async (req, res) => {
  await logAction({ userId: req.user?._id, action: 'LOGOUT', targetType: 'User', targetId: req.user?._id });
  return successResponse(res, 200, 'Logged out successfully');
});

/** Marks the first-login guided tour as complete (or re-marks it — replaying the tour never unsets this). */
const completeOnboarding = asyncHandler(async (req, res) => {
  req.user.onboardingCompleted = true;
  await req.user.save();
  return successResponse(res, 200, 'Onboarding marked complete', { user: sanitizeUser(req.user) });
});

module.exports = { register, login, me, logout, completeOnboarding, signToken, sanitizeUser };
