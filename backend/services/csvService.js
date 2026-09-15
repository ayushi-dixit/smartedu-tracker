/**
 * Parses and validates the faculty CSV import format, then applies
 * validated rows as academic records. Risk is always recalculated by
 * the backend risk engine afterwards — values in the CSV such as a
 * risk score/level (if present) are ignored, never trusted.
 */

const { parse } = require('csv-parse/sync');
const Student = require('../models/Student');
const { recalculateAndStoreRisk } = require('./riskCalculationService');
const { applyAcademicSnapshot } = require('./academicRecordService');
const { round2 } = require('../utils/helpers');

const REQUIRED_COLUMNS = [
  'student_id',
  'student_name',
  'email',
  'course',
  'semester',
  'section',
  'attendance_pct',
  'internal_1',
  'internal_2',
  'assignments_total',
  'assignments_submitted',
  'previous_semester_avg',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRow(row, rowNumber) {
  const errors = [];

  for (const col of REQUIRED_COLUMNS) {
    if (row[col] === undefined || row[col] === null || String(row[col]).trim() === '') {
      errors.push(`Row ${rowNumber}: missing value for "${col}"`);
    }
  }
  if (errors.length) return errors;

  if (!EMAIL_RE.test(row.email)) errors.push(`Row ${rowNumber}: invalid email "${row.email}"`);

  const numericFields = ['semester', 'attendance_pct', 'internal_1', 'internal_2', 'assignments_total', 'assignments_submitted', 'previous_semester_avg'];
  for (const f of numericFields) {
    if (Number.isNaN(Number(row[f]))) errors.push(`Row ${rowNumber}: "${f}" must be numeric`);
  }
  if (errors.length) return errors;

  const attendancePct = Number(row.attendance_pct);
  if (attendancePct < 0 || attendancePct > 100) errors.push(`Row ${rowNumber}: attendance_pct out of range 0-100`);

  const assignmentsTotal = Number(row.assignments_total);
  const assignmentsSubmitted = Number(row.assignments_submitted);
  if (assignmentsSubmitted > assignmentsTotal) errors.push(`Row ${rowNumber}: assignments_submitted cannot exceed assignments_total`);
  if (assignmentsTotal < 0 || assignmentsSubmitted < 0) errors.push(`Row ${rowNumber}: assignment counts cannot be negative`);

  const prevAvg = Number(row.previous_semester_avg);
  if (prevAvg < 0 || prevAvg > 100) errors.push(`Row ${rowNumber}: previous_semester_avg out of range 0-100`);

  const internal1 = Number(row.internal_1);
  const internal2 = Number(row.internal_2);
  if (internal1 < 0 || internal1 > 100) errors.push(`Row ${rowNumber}: internal_1 out of range 0-100`);
  if (internal2 < 0 || internal2 > 100) errors.push(`Row ${rowNumber}: internal_2 out of range 0-100`);

  return errors;
}

/**
 * Imports a CSV buffer for the given faculty user.
 * Uses (and creates, if missing) a single "General" subject for imported
 * academic records, since the CSV format is per-student, not per-subject.
 */
async function importStudentsCsv({ csvBuffer, facultyDoc }) {
  const content = csvBuffer.toString('utf-8');

  let rows;
  try {
    rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    return {
      totalRows: 0,
      successful: 0,
      failed: 0,
      duplicate: 0,
      invalid: 0,
      errors: [`Could not parse CSV: ${err.message}`],
    };
  }

  if (rows.length === 0) {
    return { totalRows: 0, successful: 0, failed: 0, duplicate: 0, invalid: 0, errors: ['CSV file is empty.'] };
  }

  const header = Object.keys(rows[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missingColumns.length) {
    return {
      totalRows: rows.length,
      successful: 0,
      failed: rows.length,
      duplicate: 0,
      invalid: rows.length,
      errors: [`Missing required column(s): ${missingColumns.join(', ')}`],
    };
  }

  const summary = { totalRows: rows.length, successful: 0, failed: 0, duplicate: 0, invalid: 0, errors: [] };
  const seenIds = new Set();

  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 2; // account for header row
    const row = rows[i];

    const rowErrors = validateRow(row, rowNumber);
    if (rowErrors.length) {
      summary.invalid += 1;
      summary.failed += 1;
      summary.errors.push(...rowErrors);
      continue;
    }

    if (seenIds.has(row.student_id)) {
      summary.duplicate += 1;
      summary.failed += 1;
      summary.errors.push(`Row ${rowNumber}: duplicate student_id "${row.student_id}" within this file`);
      continue;
    }
    seenIds.add(row.student_id);

    try {
      let student = await Student.findOne({ studentId: row.student_id });
      let isNewStudentDoc = false;

      if (!student) {
        student = new Student({
          studentId: row.student_id,
          fullName: row.student_name,
          email: row.email.toLowerCase(),
          course: row.course,
          semester: Number(row.semester),
          section: row.section,
          previousSemesterAverage: round2(Number(row.previous_semester_avg)),
          facultyIds: facultyDoc ? [facultyDoc._id] : [],
          status: 'ACTIVE',
        });
        isNewStudentDoc = true;
        // userId is required by the schema; imported students without a
        // linked login account get a placeholder that admin can later
        // attach a real User to via account creation.
      } else {
        student.fullName = row.student_name;
        student.email = row.email.toLowerCase();
        student.course = row.course;
        student.semester = Number(row.semester);
        student.section = row.section;
        student.previousSemesterAverage = round2(Number(row.previous_semester_avg));
        if (facultyDoc && !student.facultyIds.some((id) => id.equals(facultyDoc._id))) {
          student.facultyIds.push(facultyDoc._id);
        }
      }

      if (isNewStudentDoc && !student.userId) {
        summary.failed += 1;
        summary.errors.push(
          `Row ${rowNumber}: student "${row.student_id}" has no linked login account yet. Create the student's user account first (Admin > Student Management), then re-import to attach academic records.`
        );
        continue;
      }

      await student.save();

      await applyAcademicSnapshot(student._id, {
        attendancePct: Number(row.attendance_pct),
        internal1: Number(row.internal_1),
        internal2: Number(row.internal_2),
        assignmentsTotal: Number(row.assignments_total),
        assignmentsSubmitted: Number(row.assignments_submitted),
      });

      await recalculateAndStoreRisk(student._id);

      summary.successful += 1;
    } catch (err) {
      summary.failed += 1;
      summary.errors.push(`Row ${rowNumber}: ${err.message}`);
    }
  }

  return summary;
}

module.exports = { importStudentsCsv, REQUIRED_COLUMNS };
