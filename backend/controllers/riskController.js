const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { canAccessStudent } = require('./studentController');
const { recalculateAndStoreRisk, getCurrentRisk, getRiskHistory } = require('../services/riskCalculationService');
const { logAction } = require('../services/auditService');
const { notifyUser } = require('../services/notificationService');

/** Faculty/admin trigger recalculation (students view only, per spec: cannot change calculated risk manually — but they CAN request a refresh of their own view via the current-risk read endpoint). */
const calculateRisk = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student) || req.user.role === 'STUDENT') {
    throw new ApiError(403, 'Forbidden. Only faculty/admin can trigger a risk recalculation.');
  }

  const previous = await getCurrentRisk(student._id);
  const record = await recalculateAndStoreRisk(student._id);
  await logAction({ userId: req.user._id, action: 'RISK_CALCULATED', targetType: 'RiskAssessment', targetId: record._id, metadata: { studentId: student._id } });

  // Notify only on a genuine change — never spam on every recalculation.
  const levelChanged = !previous || previous.riskLevel !== record.riskLevel;
  if (levelChanged && student.userId) {
    await notifyUser({
      userId: student.userId,
      type: 'RISK_LEVEL_CHANGED',
      title: 'Your risk level changed',
      message: previous
        ? `Your academic risk level changed from ${previous.riskLevel} to ${record.riskLevel} (score ${record.totalRiskScore}).`
        : `Your initial academic risk assessment is ${record.riskLevel} (score ${record.totalRiskScore}).`,
      relatedStudentId: student._id,
    });
  }
  if (levelChanged && record.riskLevel === 'HIGH' && student.facultyIds?.length) {
    const facultyDocs = await Faculty.find({ _id: { $in: student.facultyIds } }).select('userId');
    await Promise.all(
      facultyDocs.map((f) =>
        notifyUser({
          userId: f.userId,
          type: 'STUDENT_HIGH_RISK_ALERT',
          title: 'A student is now HIGH risk',
          message: `${student.fullName} (${student.studentId}) is now HIGH risk (score ${record.totalRiskScore}). Consider recording an intervention.`,
          relatedStudentId: student._id,
        })
      )
    );
  }

  return successResponse(res, 201, 'Risk calculated successfully', { risk: record });
});

const getCurrent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

  const record = await getCurrentRisk(student._id);
  if (!record) {
    return successResponse(res, 200, 'No risk assessment yet for this student.', { risk: null });
  }
  return successResponse(res, 200, 'Current risk retrieved', { risk: record });
});

const getHistory = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

  const history = await getRiskHistory(student._id);
  return successResponse(res, 200, 'Risk history retrieved', { history: history.reverse() });
});

module.exports = { calculateRisk, getCurrent, getHistory };
