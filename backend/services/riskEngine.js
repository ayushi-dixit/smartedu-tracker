/**
 * Risk Engine — SINGLE SOURCE OF TRUTH for all risk math.
 *
 * Used by: risk recalculation, CSV import, what-if simulator, and
 * intervention follow-up. Do not duplicate this formula anywhere else
 * (frontend included) — the frontend only renders numbers this module produces.
 *
 * Weights: Attendance 25%, Academic 35%, Assignments 15%, Trend 25%.
 */

const { round2, clamp } = require('../utils/helpers');

const CALCULATION_VERSION = '1.0';

const WEIGHTS = {
  attendance: 0.25,
  academic: 0.35,
  assignment: 0.15,
  trend: 0.25,
};

const RISK_THRESHOLDS = {
  LOW_MAX: 40, // score < 40 -> LOW
  MEDIUM_MAX: 65, // score < 65 -> MEDIUM, else HIGH
};

function calculateAttendanceRisk(attendancePercentage) {
  return round2(clamp(100 - attendancePercentage, 0, 100));
}

function calculateAcademicRisk(academicAverage) {
  return round2(clamp(100 - academicAverage, 0, 100));
}

function calculateAssignmentRisk(assignmentCompletionPercentage) {
  return round2(clamp(100 - assignmentCompletionPercentage, 0, 100));
}

/**
 * Determine trend from an ordered list of assessment percentages
 * (chronological, earliest first). Returns { trendDelta, trendStatus }.
 */
function calculateTrend(assessmentPercentagesChronological) {
  const list = assessmentPercentagesChronological || [];

  if (list.length < 2) {
    return { trendDelta: 0, trendStatus: 'INSUFFICIENT_DATA' };
  }

  const earliest = list[0];
  const latest = list[list.length - 1];
  let trendDelta = latest - earliest;
  trendDelta = clamp(trendDelta, -25, 25);

  let trendStatus;
  if (trendDelta <= -5) trendStatus = 'DECLINING';
  else if (trendDelta >= 5) trendStatus = 'IMPROVING';
  else trendStatus = 'STABLE';

  return { trendDelta: round2(trendDelta), trendStatus };
}

/** trendDelta -> trendRisk (0-100), 50 is neutral. */
function calculateTrendRisk(trendDelta, trendStatus) {
  if (trendStatus === 'INSUFFICIENT_DATA') return 50;
  return round2(clamp(50 - trendDelta * 2, 0, 100));
}

function calculateRiskScore({ attendanceRisk, academicRisk, assignmentRisk, trendRisk }) {
  const score =
    attendanceRisk * WEIGHTS.attendance +
    academicRisk * WEIGHTS.academic +
    assignmentRisk * WEIGHTS.assignment +
    trendRisk * WEIGHTS.trend;
  return round2(clamp(score, 0, 100));
}

function getRiskLevel(totalRiskScore) {
  if (totalRiskScore < RISK_THRESHOLDS.LOW_MAX) return 'LOW';
  if (totalRiskScore < RISK_THRESHOLDS.MEDIUM_MAX) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Core entry point. Pure function — no DB access — so it can be reused
 * identically by the real risk calculation and the what-if simulator.
 *
 * Input:
 *   attendancePercentage: number (0-100)
 *   academicAverage: number (0-100)
 *   assignmentCompletionPercentage: number (0-100)
 *   assessmentPercentagesChronological: number[] (optional, for trend)
 *   trendDeltaOverride: number (optional — used by simulator when caller
 *       supplies a raw trendDelta directly instead of a series)
 */
function calculateStudentRisk(input) {
  const {
    attendancePercentage,
    academicAverage,
    assignmentCompletionPercentage,
    assessmentPercentagesChronological,
    trendDeltaOverride,
  } = input;

  const attendanceRisk = calculateAttendanceRisk(attendancePercentage);
  const academicRisk = calculateAcademicRisk(academicAverage);
  const assignmentRisk = calculateAssignmentRisk(assignmentCompletionPercentage);

  let trendDelta;
  let trendStatus;

  if (typeof trendDeltaOverride === 'number') {
    trendDelta = clamp(trendDeltaOverride, -25, 25);
    if (trendDelta <= -5) trendStatus = 'DECLINING';
    else if (trendDelta >= 5) trendStatus = 'IMPROVING';
    else trendStatus = 'STABLE';
  } else {
    const trend = calculateTrend(assessmentPercentagesChronological);
    trendDelta = trend.trendDelta;
    trendStatus = trend.trendStatus;
  }

  const trendRisk = calculateTrendRisk(trendDelta, trendStatus);

  const totalRiskScore = calculateRiskScore({
    attendanceRisk,
    academicRisk,
    assignmentRisk,
    trendRisk,
  });

  const riskLevel = getRiskLevel(totalRiskScore);

  return {
    attendancePercentage: round2(attendancePercentage),
    attendanceRisk,
    academicAverage: round2(academicAverage),
    academicRisk,
    assignmentCompletionPercentage: round2(assignmentCompletionPercentage),
    assignmentRisk,
    trendDelta,
    trendStatus,
    trendRisk,
    totalRiskScore,
    riskLevel,
    calculationVersion: CALCULATION_VERSION,
  };
}

module.exports = {
  CALCULATION_VERSION,
  WEIGHTS,
  RISK_THRESHOLDS,
  calculateAttendanceRisk,
  calculateAcademicRisk,
  calculateAssignmentRisk,
  calculateTrend,
  calculateTrendRisk,
  calculateRiskScore,
  getRiskLevel,
  calculateStudentRisk,
};
