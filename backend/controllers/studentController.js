const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Intervention = require('../models/Intervention');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { getStudentAcademicMetrics } = require('../services/dashboardService');
const { getCurrentRisk, recalculateAndStoreRisk } = require('../services/riskCalculationService');
const { applyAcademicSnapshot } = require('../services/academicRecordService');
const { logAction } = require('../services/auditService');

const ATTENDANCE_ALERT_THRESHOLD = 65;

/** True if the requesting user may view/edit this student record. */
function canAccessStudent(req, student) {
  if (req.user.role === 'ADMIN') return true;
  if (req.user.role === 'STUDENT') return req.profile && student._id.equals(req.profile._id);
  if (req.user.role === 'FACULTY') {
    return req.profile && student.facultyIds.some((id) => id.equals(req.profile._id));
  }
  return false;
}

/**
 * List students — faculty see only assigned students, admin sees all.
 * Supports search (name/studentId/email) and risk/semester/section filters.
 * Also returns a `summary` block (real-time, computed from the same scoped
 * student set — never hardcoded) for faculty/admin dashboard stat cards.
 */
const listStudents = asyncHandler(async (req, res) => {
  const { risk, search, semester, section } = req.query;
  const query = {};

  if (req.user.role === 'FACULTY') {
    if (!req.profile) throw new ApiError(404, 'Faculty profile not found for this account.');
    query.facultyIds = req.profile._id;
  } else if (req.user.role === 'STUDENT') {
    throw new ApiError(403, 'Students cannot list other students.');
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (semester) query.semester = Number(semester);
  if (section) query.section = section;

  let students = await Student.find(query).sort({ fullName: 1 }).lean();

  // Attach current risk level to each row for the faculty/admin table view.
  const withRisk = await Promise.all(
    students.map(async (s) => {
      const current = await getCurrentRisk(s._id);
      return { ...s, currentRisk: current || null };
    })
  );

  const filtered = risk ? withRisk.filter((s) => s.currentRisk && s.currentRisk.riskLevel === risk.toUpperCase()) : withRisk;

  const studentIds = withRisk.map((s) => s._id);
  const followUpsDue = await Intervention.countDocuments({
    studentId: { $in: studentIds },
    status: 'PENDING',
    followUpDate: { $ne: null, $lte: new Date() },
  });
  const attendanceAlerts = withRisk.filter((s) => s.currentRisk && s.currentRisk.attendancePercentage < ATTENDANCE_ALERT_THRESHOLD).length;

  const summary = {
    total: withRisk.length,
    low: withRisk.filter((s) => s.currentRisk?.riskLevel === 'LOW').length,
    medium: withRisk.filter((s) => s.currentRisk?.riskLevel === 'MEDIUM').length,
    high: withRisk.filter((s) => s.currentRisk?.riskLevel === 'HIGH').length,
    unassessed: withRisk.filter((s) => !s.currentRisk).length,
    followUpsDue,
    attendanceAlerts,
  };

  return successResponse(res, 200, 'Students retrieved', { students: filtered, count: filtered.length, summary });
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found.');

  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden. You cannot access this student.');

  const metrics = await getStudentAcademicMetrics(student._id);
  const currentRisk = await getCurrentRisk(student._id);

  return successResponse(res, 200, 'Student retrieved', { student, metrics, currentRisk });
});

/**
 * Admin-only: creates the linked User (role STUDENT) + Student profile
 * together in one step — mirrors createFaculty, and avoids depending on
 * a separate self-registration step to satisfy Student.userId (required).
 *
 * Optionally accepts an initial academic snapshot (attendance, two internal
 * marks, assignment counts). If provided, real Attendance/Assessment/
 * Assignment records are created via the same helper CSV import uses, and
 * risk is calculated immediately so the new student's dashboard isn't
 * empty on first login. If omitted, the student is created with no risk
 * yet — the dashboard handles that "insufficient data" state gracefully.
 */
const createStudent = asyncHandler(async (req, res) => {
  const {
    email, password, studentId, fullName, phone, course, semester, section, enrollmentYear, previousSemesterAverage, facultyIds,
    attendancePct, internal1, internal2, assignmentsTotal, assignmentsSubmitted,
  } = req.body;

  if (!email || !password || !studentId || !fullName) {
    throw new ApiError(422, 'email, password, studentId and fullName are required.');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new ApiError(409, 'A user with this email already exists.');

  const existingStudent = await Student.findOne({ studentId });
  if (existingStudent) throw new ApiError(409, 'A student with this studentId already exists.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: email.toLowerCase(), passwordHash, role: 'STUDENT', status: 'ACTIVE' });

  const student = await Student.create({
    userId: user._id,
    studentId,
    fullName,
    email: email.toLowerCase(),
    phone: phone || '',
    course: course || 'MCA',
    semester,
    section: section || '',
    enrollmentYear,
    previousSemesterAverage: previousSemesterAverage ?? null,
    facultyIds: facultyIds || [],
  });

  await logAction({ userId: req.user._id, action: 'STUDENT_CREATED', targetType: 'Student', targetId: student._id });

  const hasInitialData = [attendancePct, internal1, internal2, assignmentsTotal, assignmentsSubmitted].every(
    (v) => v !== undefined && v !== null && v !== ''
  );

  let currentRisk = null;
  if (hasInitialData) {
    await applyAcademicSnapshot(student._id, { attendancePct, internal1, internal2, assignmentsTotal, assignmentsSubmitted });
    currentRisk = await recalculateAndStoreRisk(student._id);
  }

  return successResponse(res, 201, 'Student created', { student, currentRisk });
});

/** Admin or assigned faculty may update non-calculated profile fields. Risk fields can never be set here. */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found.');

  if (!canAccessStudent(req, student) || req.user.role === 'STUDENT') {
    throw new ApiError(403, 'Forbidden. You cannot update this student.');
  }

  const editable = ['fullName', 'phone', 'course', 'semester', 'section', 'enrollmentYear', 'previousSemesterAverage', 'status'];
  if (req.user.role === 'ADMIN') editable.push('facultyIds');

  editable.forEach((field) => {
    if (req.body[field] !== undefined) student[field] = req.body[field];
  });

  await student.save();
  await logAction({ userId: req.user._id, action: 'STUDENT_UPDATED', targetType: 'Student', targetId: student._id });

  return successResponse(res, 200, 'Student updated', { student });
});

module.exports = { listStudents, getStudentById, createStudent, updateStudent, canAccessStudent };
