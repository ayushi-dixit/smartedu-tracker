const Subject = require('../models/Subject');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { logAction } = require('../services/auditService');

const listSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().sort({ semester: 1, subjectCode: 1 });
  return successResponse(res, 200, 'Subjects retrieved', { subjects, count: subjects.length });
});

const createSubject = asyncHandler(async (req, res) => {
  const { subjectCode, subjectName, semester, credits, facultyId } = req.body;
  if (!subjectCode || !subjectName || !semester || !credits) {
    throw new ApiError(422, 'subjectCode, subjectName, semester and credits are required.');
  }

  const existing = await Subject.findOne({ subjectCode });
  if (existing) throw new ApiError(409, 'A subject with this subjectCode already exists.');

  const subject = await Subject.create({ subjectCode, subjectName, semester, credits, facultyId: facultyId || null });
  await logAction({ userId: req.user._id, action: 'SUBJECT_CREATED', targetType: 'Subject', targetId: subject._id });

  return successResponse(res, 201, 'Subject created', { subject });
});

const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new ApiError(404, 'Subject not found.');

  const editable = ['subjectName', 'semester', 'credits', 'facultyId', 'status'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) subject[field] = req.body[field];
  });

  await subject.save();
  await logAction({ userId: req.user._id, action: 'SUBJECT_UPDATED', targetType: 'Subject', targetId: subject._id });

  return successResponse(res, 200, 'Subject updated', { subject });
});

const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new ApiError(404, 'Subject not found.');

  subject.status = 'INACTIVE';
  await subject.save();
  await logAction({ userId: req.user._id, action: 'SUBJECT_DEACTIVATED', targetType: 'Subject', targetId: subject._id });

  return successResponse(res, 200, 'Subject deactivated', { subject });
});

module.exports = { listSubjects, createSubject, updateSubject, deleteSubject };
