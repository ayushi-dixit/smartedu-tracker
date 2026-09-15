const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { successResponse, asyncHandler, ApiError, round2 } = require('../utils/helpers');
const { canAccessStudent } = require('./studentController');
const { logAction } = require('../services/auditService');

/** Faculty/admin only — students cannot write academic records. */
const addAttendance = asyncHandler(async (req, res) => {
  const { studentId, subjectId, totalClasses, attendedClasses, recordDate } = req.body;

  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden. Not your assigned student.');

  // Backend always computes the percentage — never trust a client-sent value.
  const attendancePercentage = round2((Number(attendedClasses) / Number(totalClasses)) * 100);

  const record = await Attendance.create({
    studentId,
    subjectId,
    totalClasses,
    attendedClasses,
    attendancePercentage,
    recordDate: recordDate || Date.now(),
  });

  await logAction({ userId: req.user._id, action: 'ATTENDANCE_ADDED', targetType: 'Attendance', targetId: record._id, metadata: { studentId } });

  return successResponse(res, 201, 'Attendance recorded', { attendance: record });
});

const getAttendanceForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

  const records = await Attendance.find({ studentId: student._id }).populate('subjectId', 'subjectCode subjectName').sort({ recordDate: -1 });
  return successResponse(res, 200, 'Attendance retrieved', { attendance: records });
});

const updateAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Attendance record not found.');

  const student = await Student.findById(record.studentId);
  if (!canAccessStudent(req, student) || req.user.role === 'STUDENT') throw new ApiError(403, 'Forbidden.');

  const totalClasses = req.body.totalClasses ?? record.totalClasses;
  const attendedClasses = req.body.attendedClasses ?? record.attendedClasses;
  if (Number(attendedClasses) > Number(totalClasses)) throw new ApiError(422, 'attendedClasses cannot exceed totalClasses.');

  record.totalClasses = totalClasses;
  record.attendedClasses = attendedClasses;
  record.attendancePercentage = round2((Number(attendedClasses) / Number(totalClasses)) * 100);
  if (req.body.recordDate) record.recordDate = req.body.recordDate;

  await record.save();
  await logAction({ userId: req.user._id, action: 'ATTENDANCE_UPDATED', targetType: 'Attendance', targetId: record._id });

  return successResponse(res, 200, 'Attendance updated', { attendance: record });
});

module.exports = { addAttendance, getAttendanceForStudent, updateAttendance };
