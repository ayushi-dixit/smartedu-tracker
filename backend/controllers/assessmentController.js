const Assessment = require('../models/Assessment');
const Student = require('../models/Student');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { canAccessStudent } = require('./studentController');
const { logAction } = require('../services/auditService');

const addAssessment = asyncHandler(async (req, res) => {
  const { studentId, subjectId, assessmentType, marksObtained, maxMarks, assessmentDate } = req.body;

  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden. Not your assigned student.');

  if (Number(marksObtained) > Number(maxMarks)) throw new ApiError(422, 'marksObtained cannot exceed maxMarks.');

  const record = await Assessment.create({
    studentId,
    subjectId,
    assessmentType,
    marksObtained,
    maxMarks,
    assessmentDate: assessmentDate || Date.now(),
  });

  await logAction({ userId: req.user._id, action: 'ASSESSMENT_ADDED', targetType: 'Assessment', targetId: record._id, metadata: { studentId } });

  return successResponse(res, 201, 'Assessment recorded', { assessment: record });
});

const getAssessmentsForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

  const records = await Assessment.find({ studentId: student._id }).populate('subjectId', 'subjectCode subjectName').sort({ assessmentDate: 1 });
  return successResponse(res, 200, 'Assessments retrieved', { assessments: records });
});

const updateAssessment = asyncHandler(async (req, res) => {
  const record = await Assessment.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Assessment record not found.');

  const student = await Student.findById(record.studentId);
  if (!canAccessStudent(req, student) || req.user.role === 'STUDENT') throw new ApiError(403, 'Forbidden.');

  const marksObtained = req.body.marksObtained ?? record.marksObtained;
  const maxMarks = req.body.maxMarks ?? record.maxMarks;
  if (Number(marksObtained) > Number(maxMarks)) throw new ApiError(422, 'marksObtained cannot exceed maxMarks.');

  ['assessmentType', 'assessmentDate'].forEach((f) => {
    if (req.body[f] !== undefined) record[f] = req.body[f];
  });
  record.marksObtained = marksObtained;
  record.maxMarks = maxMarks;

  await record.save();
  await logAction({ userId: req.user._id, action: 'ASSESSMENT_UPDATED', targetType: 'Assessment', targetId: record._id });

  return successResponse(res, 200, 'Assessment updated', { assessment: record });
});

module.exports = { addAssessment, getAssessmentsForStudent, updateAssessment };
