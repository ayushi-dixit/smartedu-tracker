const Student = require('../models/Student');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { canAccessStudent } = require('./studentController');
const { getCurrentRisk } = require('../services/riskCalculationService');
const { generateRiskExplanation } = require('../services/aiService');
const { logAction } = require('../services/auditService');

/**
 * Generates an AI explanation for the student's CURRENT stored risk
 * assessment. The AI never computes risk — it only explains numbers
 * the risk engine already produced.
 */
const getExplanation = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

  const risk = await getCurrentRisk(student._id);
  if (!risk) {
    throw new ApiError(422, 'No risk assessment exists yet for this student. Calculate risk first.');
  }

  const payload = {
    student: { name: student.fullName, semester: student.semester, course: student.course },
    academicMetrics: {
      attendancePercentage: risk.attendancePercentage,
      academicAverage: risk.academicAverage,
      assignmentCompletionPercentage: risk.assignmentCompletionPercentage,
      trendDelta: risk.trendDelta,
      trendStatus: risk.trendStatus,
    },
    risk: {
      attendanceRisk: risk.attendanceRisk,
      academicRisk: risk.academicRisk,
      assignmentRisk: risk.assignmentRisk,
      trendRisk: risk.trendRisk,
      totalRiskScore: risk.totalRiskScore,
      riskLevel: risk.riskLevel,
    },
  };

  const result = await generateRiskExplanation(payload);

  await logAction({
    userId: req.user._id,
    action: 'AI_EXPLANATION_REQUESTED',
    targetType: 'Student',
    targetId: student._id,
    metadata: { success: result.success },
  });

  if (!result.success) {
    // Per spec: AI failure must never break the academic risk system.
    // Risk score/level are still available on the frontend from `risk` (fetched separately).
    return successResponse(res, 200, 'Risk data available; AI explanation unavailable', {
      available: false,
      reason: 'AI explanation is temporarily unavailable. Please try again.',
      debugReason: process.env.NODE_ENV !== 'production' ? result.reason : undefined,
    });
  }

  return successResponse(res, 200, 'AI explanation generated', { available: true, explanation: result.explanation });
});

module.exports = { getExplanation };
