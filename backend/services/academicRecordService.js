/**
 * Shared helper for turning a compact "snapshot" (attendance %, two
 * internal marks, assignment completion) into real Attendance/Assessment/
 * Assignment records against a general subject. Used by BOTH the CSV
 * importer and the Admin "Add Student" initial-data flow, so there is
 * exactly one implementation instead of two copies drifting apart.
 *
 * Trend is deliberately NOT a raw input here — it is derived by the risk
 * engine from the chronological internal_1 -> internal_2 percentages,
 * consistent with how trend is computed everywhere else in the system.
 */

const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Assessment = require('../models/Assessment');
const Assignment = require('../models/Assignment');
const { round2 } = require('../utils/helpers');

const GENERAL_SUBJECT_CODE = 'GEN-IMPORT';

async function getOrCreateGeneralSubject() {
  let subject = await Subject.findOne({ subjectCode: GENERAL_SUBJECT_CODE });
  if (!subject) {
    subject = await Subject.create({
      subjectCode: GENERAL_SUBJECT_CODE,
      subjectName: 'General (Bulk/Manual Academic Entry)',
      semester: 1,
      credits: 1,
      status: 'ACTIVE',
    });
  }
  return subject;
}

/**
 * Creates one attendance record, two internal assessments (older/newer,
 * so a trend can be derived), and N assignment records for a student
 * against the shared general subject.
 */
async function applyAcademicSnapshot(studentId, { attendancePct, internal1, internal2, assignmentsTotal, assignmentsSubmitted }) {
  const subject = await getOrCreateGeneralSubject();

  const totalClasses = 100;
  const attendedClasses = Math.round((Number(attendancePct) / 100) * totalClasses);
  await Attendance.create({
    studentId,
    subjectId: subject._id,
    totalClasses,
    attendedClasses,
    attendancePercentage: round2((attendedClasses / totalClasses) * 100),
    recordDate: new Date(),
  });

  await Assessment.create({
    studentId,
    subjectId: subject._id,
    assessmentType: 'INTERNAL_1',
    marksObtained: round2(Number(internal1)),
    maxMarks: 100,
    assessmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  });
  await Assessment.create({
    studentId,
    subjectId: subject._id,
    assessmentType: 'INTERNAL_2',
    marksObtained: round2(Number(internal2)),
    maxMarks: 100,
    assessmentDate: new Date(),
  });

  const total = Math.max(0, Number(assignmentsTotal) || 0);
  const submitted = Math.min(total, Math.max(0, Number(assignmentsSubmitted) || 0));
  for (let a = 1; a <= total; a += 1) {
    const isSubmitted = a <= submitted;
    await Assignment.create({
      studentId,
      subjectId: subject._id,
      assignmentTitle: `Assignment ${a}`,
      maxScore: 10,
      obtainedScore: isSubmitted ? 8 : null,
      status: isSubmitted ? 'SUBMITTED_ON_TIME' : 'NOT_SUBMITTED',
      dueDate: new Date(),
      submissionDate: isSubmitted ? new Date() : null,
    });
  }

  return subject;
}

module.exports = { getOrCreateGeneralSubject, applyAcademicSnapshot, GENERAL_SUBJECT_CODE };
