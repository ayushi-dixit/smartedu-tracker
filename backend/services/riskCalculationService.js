/**
 * Ties together dashboardService (raw data aggregation) and riskEngine
 * (pure math) to produce and persist a new RiskAssessment document.
 * This is the ONLY place that writes RiskAssessment records for real
 * student data — CSV import and intervention follow-up both call this,
 * so there is exactly one code path from "raw data" to "stored risk".
 */

const RiskAssessment = require('../models/RiskAssessment');
const { getStudentAcademicMetrics } = require('./dashboardService');
const { calculateStudentRisk } = require('./riskEngine');
const { ApiError } = require('../utils/helpers');

/**
 * Recalculates a student's risk from current DB state and stores a new
 * RiskAssessment record (history is never overwritten).
 * Throws ApiError(422) if required data is missing.
 */
async function recalculateAndStoreRisk(studentId) {
  const metrics = await getStudentAcademicMetrics(studentId);

  if (!metrics.isComplete) {
    throw new ApiError(
      422,
      `Insufficient academic data for complete risk assessment. Missing: ${metrics.missing.join(', ')}.`
    );
  }

  const result = calculateStudentRisk({
    attendancePercentage: metrics.attendance.attendancePercentage,
    academicAverage: metrics.academic.academicAverage,
    assignmentCompletionPercentage: metrics.assignment.assignmentCompletionPercentage,
    assessmentPercentagesChronological: metrics.academic.chronologicalPercentages,
  });

  const record = await RiskAssessment.create({
    studentId,
    ...result,
  });

  return record;
}

async function getCurrentRisk(studentId) {
  return RiskAssessment.findOne({ studentId }).sort({ createdAt: -1 });
}

async function getRiskHistory(studentId, limit = 50) {
  return RiskAssessment.find({ studentId }).sort({ createdAt: -1 }).limit(limit);
}

module.exports = { recalculateAndStoreRisk, getCurrentRisk, getRiskHistory };
