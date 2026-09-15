const { successResponse, asyncHandler, ApiError, round2 } = require('../utils/helpers');
const { calculateStudentRisk } = require('../services/riskEngine');
const Student = require('../models/Student');
const { canAccessStudent } = require('./studentController');
const { getCurrentRisk } = require('../services/riskCalculationService');
const { logAction } = require('../services/auditService');

/**
 * What-if simulator. Uses the SAME riskEngine.calculateStudentRisk() used
 * for real calculations — no second formula. Never writes to the database.
 *
 * When a studentId is supplied, the FRONTEND is expected to pre-fill the
 * simulator inputs from that student's actual current risk breakdown
 * (attendancePercentage/academicAverage/assignmentCompletionPercentage/
 * trendDelta) — this endpoint doesn't silently substitute defaults; it
 * simulates exactly the numbers it's given and, when a student is
 * provided, also returns their real current breakdown for a proper
 * current-vs-simulated comparison.
 */
const simulateRisk = asyncHandler(async (req, res) => {
  const { studentId, attendancePercentage, academicAverage, assignmentCompletionPercentage, trendDelta } = req.body;

  let currentBreakdown = null;

  if (studentId) {
    const student = await Student.findById(studentId);
    if (!student) throw new ApiError(404, 'Student not found.');
    if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

    const current = await getCurrentRisk(student._id);
    if (current) currentBreakdown = current;
  }

  const simulated = calculateStudentRisk({
    attendancePercentage: Number(attendancePercentage),
    academicAverage: Number(academicAverage),
    assignmentCompletionPercentage: Number(assignmentCompletionPercentage),
    trendDeltaOverride: Number(trendDelta),
  });

  await logAction({ userId: req.user._id, action: 'SIMULATOR_RUN', targetType: 'Student', targetId: studentId || null });

  const difference = currentBreakdown
    ? {
        totalRiskScore: round2(simulated.totalRiskScore - currentBreakdown.totalRiskScore),
        attendancePercentage: round2(Number(attendancePercentage) - currentBreakdown.attendancePercentage),
        academicAverage: round2(Number(academicAverage) - currentBreakdown.academicAverage),
        assignmentCompletionPercentage: round2(Number(assignmentCompletionPercentage) - currentBreakdown.assignmentCompletionPercentage),
        trendDelta: round2(Number(trendDelta) - currentBreakdown.trendDelta),
      }
    : null;

  return successResponse(res, 200, 'Simulation calculated', {
    // Legacy flat fields kept for backward compatibility with the previous frontend build.
    currentRiskScore: currentBreakdown?.totalRiskScore ?? null,
    currentRiskLevel: currentBreakdown?.riskLevel ?? null,
    currentBreakdown,
    simulatedRiskScore: simulated.totalRiskScore,
    simulatedRiskLevel: simulated.riskLevel,
    simulatedBreakdown: simulated,
    difference,
    disclaimer: 'This is a hypothetical simulation. Your actual academic records have not been changed.',
  });
});

module.exports = { simulateRisk };
