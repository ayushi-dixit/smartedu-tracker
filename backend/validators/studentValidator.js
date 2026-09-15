const { body } = require('express-validator');

const studentValidator = [
  body('studentId').notEmpty().withMessage('studentId is required.'),
  body('fullName').notEmpty().withMessage('fullName is required.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('semester must be between 1 and 8.'),
];

const interventionValidator = [
  body('studentId').notEmpty().withMessage('studentId is required.'),
  body('interventionType').isIn([
    'ATTENDANCE_COUNSELLING',
    'ACADEMIC_COUNSELLING',
    'DOUBT_SESSION',
    'ASSIGNMENT_REMINDER',
    'STUDY_SUPPORT',
    'FACULTY_FOLLOW_UP',
    'OTHER',
  ]),
  body('reason').notEmpty().withMessage('reason is required.'),
];

const simulatorValidator = [
  body('attendancePercentage').isFloat({ min: 0, max: 100 }).withMessage('attendancePercentage must be 0-100.'),
  body('academicAverage').isFloat({ min: 0, max: 100 }).withMessage('academicAverage must be 0-100.'),
  body('assignmentCompletionPercentage').isFloat({ min: 0, max: 100 }).withMessage('assignmentCompletionPercentage must be 0-100.'),
  body('trendDelta').isFloat({ min: -25, max: 25 }).withMessage('trendDelta must be between -25 and 25.'),
];

module.exports = { studentValidator, interventionValidator, simulatorValidator };
