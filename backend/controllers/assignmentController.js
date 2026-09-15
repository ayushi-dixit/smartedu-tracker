const Assignment = require('../models/Assignment');
const Student = require('../models/Student');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { canAccessStudent } = require('./studentController');
const { logAction } = require('../services/auditService');

const addAssignment = asyncHandler(async (req, res) => {
  const { studentId, subjectId, assignmentTitle, maxScore, obtainedScore, status, dueDate, submissionDate } = req.body;

  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden. Not your assigned student.');

  if (obtainedScore !== undefined && obtainedScore !== null && Number(obtainedScore) > Number(maxScore)) {
    throw new ApiError(422, 'obtainedScore cannot exceed maxScore.');
  }

  const record = await Assignment.create({
    studentId,
    subjectId,
    assignmentTitle,
    maxScore,
    obtainedScore: obtainedScore ?? null,
    status: status || 'NOT_SUBMITTED',
    dueDate,
    submissionDate: submissionDate || null,
  });

  await logAction({ userId: req.user._id, action: 'ASSIGNMENT_UPDATED', targetType: 'Assignment', targetId: record._id, metadata: { studentId } });

  return successResponse(res, 201, 'Assignment recorded', { assignment: record });
});

const getAssignmentsForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

  const records = await Assignment.find({ studentId: student._id }).populate('subjectId', 'subjectCode subjectName').sort({ dueDate: -1 });
  return successResponse(res, 200, 'Assignments retrieved', { assignments: records });
});

const updateAssignment = asyncHandler(async (req, res) => {
  const record = await Assignment.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Assignment record not found.');

  const student = await Student.findById(record.studentId);
  if (!canAccessStudent(req, student) || req.user.role === 'STUDENT') throw new ApiError(403, 'Forbidden.');

  const editable = ['assignmentTitle', 'maxScore', 'obtainedScore', 'status', 'dueDate', 'submissionDate'];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) record[f] = req.body[f];
  });

  if (record.obtainedScore !== null && Number(record.obtainedScore) > Number(record.maxScore)) {
    throw new ApiError(422, 'obtainedScore cannot exceed maxScore.');
  }

  await record.save();
  await logAction({ userId: req.user._id, action: 'ASSIGNMENT_UPDATED', targetType: 'Assignment', targetId: record._id });

  return successResponse(res, 200, 'Assignment updated', { assignment: record });
});

module.exports = { addAssignment, getAssignmentsForStudent, updateAssignment };
