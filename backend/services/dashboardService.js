/**
 * Aggregates a student's raw academic records (attendance, assessments,
 * assignments) into the summary metrics the risk engine consumes.
 * Kept separate from riskEngine.js so riskEngine stays a pure, DB-free module.
 */

const Attendance = require('../models/Attendance');
const Assessment = require('../models/Assessment');
const Assignment = require('../models/Assignment');
const { round2 } = require('../utils/helpers');

/**
 * Weighted overall attendance percentage:
 * (total attended classes / total classes) * 100 — NOT an average of percentages.
 */
async function getAttendanceSummary(studentId) {
  const records = await Attendance.find({ studentId });
  if (records.length === 0) {
    return { attendancePercentage: null, totalClasses: 0, attendedClasses: 0, hasData: false };
  }
  const totalClasses = records.reduce((sum, r) => sum + r.totalClasses, 0);
  const attendedClasses = records.reduce((sum, r) => sum + r.attendedClasses, 0);
  const attendancePercentage = totalClasses > 0 ? round2((attendedClasses / totalClasses) * 100) : 0;
  return { attendancePercentage, totalClasses, attendedClasses, hasData: true };
}

/**
 * academicAverage = (sum of marks obtained / sum of max marks) * 100
 * across all assessments, correctly weighted even when max marks differ.
 * Also returns the assessment percentages in chronological order for trend.
 */
async function getAcademicSummary(studentId) {
  const records = await Assessment.find({ studentId }).sort({ assessmentDate: 1 });
  if (records.length === 0) {
    return { academicAverage: null, assessmentCount: 0, chronologicalPercentages: [], hasData: false };
  }
  const totalObtained = records.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMax = records.reduce((sum, r) => sum + r.maxMarks, 0);
  const academicAverage = totalMax > 0 ? round2((totalObtained / totalMax) * 100) : 0;
  const chronologicalPercentages = records.map((r) => round2((r.marksObtained / r.maxMarks) * 100));
  return { academicAverage, assessmentCount: records.length, chronologicalPercentages, hasData: true };
}

/**
 * assignmentCompletion = (submitted / total) * 100.
 * SUBMITTED_ON_TIME and SUBMITTED_LATE both count as submitted.
 */
async function getAssignmentSummary(studentId) {
  const records = await Assignment.find({ studentId });
  if (records.length === 0) {
    return { assignmentCompletionPercentage: null, total: 0, submitted: 0, hasData: false };
  }
  const total = records.length;
  const submitted = records.filter((r) => r.status !== 'NOT_SUBMITTED').length;
  const assignmentCompletionPercentage = round2((submitted / total) * 100);
  return { assignmentCompletionPercentage, total, submitted, hasData: true };
}

/**
 * Gathers everything the risk engine needs for a real student, plus
 * flags for which required data categories are missing.
 */
async function getStudentAcademicMetrics(studentId) {
  const [attendance, academic, assignment] = await Promise.all([
    getAttendanceSummary(studentId),
    getAcademicSummary(studentId),
    getAssignmentSummary(studentId),
  ]);

  const missing = [];
  if (!attendance.hasData) missing.push('attendance');
  if (!academic.hasData) missing.push('assessments');
  if (!assignment.hasData) missing.push('assignments');

  return { attendance, academic, assignment, missing, isComplete: missing.length === 0 };
}

module.exports = {
  getAttendanceSummary,
  getAcademicSummary,
  getAssignmentSummary,
  getStudentAcademicMetrics,
};
