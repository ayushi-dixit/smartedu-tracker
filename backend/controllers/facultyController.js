const bcrypt = require('bcryptjs');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { logAction } = require('../services/auditService');

const listFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.find().sort({ fullName: 1 });
  return successResponse(res, 200, 'Faculty retrieved', { faculty, count: faculty.length });
});

const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new ApiError(404, 'Faculty not found.');
  if (req.user.role === 'FACULTY' && (!req.profile || !faculty._id.equals(req.profile._id))) {
    throw new ApiError(403, 'Forbidden.');
  }
  return successResponse(res, 200, 'Faculty retrieved', { faculty });
});

/** Admin-only: creates the linked User (role FACULTY) + Faculty profile together. */
const createFaculty = asyncHandler(async (req, res) => {
  const { email, password, facultyId, fullName, department } = req.body;
  if (!email || !password || !facultyId || !fullName) {
    throw new ApiError(422, 'email, password, facultyId and fullName are required.');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new ApiError(409, 'A user with this email already exists.');

  const existingFaculty = await Faculty.findOne({ facultyId });
  if (existingFaculty) throw new ApiError(409, 'A faculty with this facultyId already exists.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: email.toLowerCase(), passwordHash, role: 'FACULTY', status: 'ACTIVE' });

  const faculty = await Faculty.create({
    userId: user._id,
    facultyId,
    fullName,
    email: email.toLowerCase(),
    department: department || 'MCA',
  });

  await logAction({ userId: req.user._id, action: 'FACULTY_CREATED', targetType: 'Faculty', targetId: faculty._id });

  return successResponse(res, 201, 'Faculty created', { faculty });
});

const updateFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new ApiError(404, 'Faculty not found.');

  const editable = ['fullName', 'department', 'status', 'assignedSubjectIds'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) faculty[field] = req.body[field];
  });

  await faculty.save();
  await logAction({ userId: req.user._id, action: 'FACULTY_UPDATED', targetType: 'Faculty', targetId: faculty._id });

  return successResponse(res, 200, 'Faculty updated', { faculty });
});

module.exports = { listFaculty, getFacultyById, createFaculty, updateFaculty };
