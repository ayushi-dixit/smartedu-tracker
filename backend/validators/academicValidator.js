const { body } = require('express-validator');

const attendanceValidator = [
  body('studentId').notEmpty().withMessage('studentId is required.'),
  body('subjectId').notEmpty().withMessage('subjectId is required.'),
  body('totalClasses').isInt({ min: 1 }).withMessage('totalClasses must be a positive integer.'),
  body('attendedClasses').isInt({ min: 0 }).withMessage('attendedClasses must be 0 or greater.')
    .custom((value, { req }) => {
      if (Number(value) > Number(req.body.totalClasses)) {
        throw new Error('attendedClasses cannot exceed totalClasses.');
      }
      return true;
    }),
];

const assessmentValidator = [
  body('studentId').notEmpty().withMessage('studentId is required.'),
  body('subjectId').notEmpty().withMessage('subjectId is required.'),
  body('assessmentType').isIn(['INTERNAL_1', 'INTERNAL_2', 'INTERNAL_3', 'QUIZ', 'MID_TERM', 'PRACTICAL']),
  body('maxMarks').isFloat({ min: 1 }).withMessage('maxMarks must be greater than 0.'),
  body('marksObtained').isFloat({ min: 0 }).withMessage('marksObtained cannot be negative.')
    .custom((value, { req }) => {
      if (Number(value) > Number(req.body.maxMarks)) {
        throw new Error('marksObtained cannot exceed maxMarks.');
      }
      return true;
    }),
];

const assignmentValidator = [
  body('studentId').notEmpty().withMessage('studentId is required.'),
  body('subjectId').notEmpty().withMessage('subjectId is required.'),
  body('assignmentTitle').notEmpty().withMessage('assignmentTitle is required.'),
  body('maxScore').isFloat({ min: 1 }).withMessage('maxScore must be greater than 0.'),
  body('status').isIn(['SUBMITTED_ON_TIME', 'SUBMITTED_LATE', 'NOT_SUBMITTED']),
  body('dueDate').notEmpty().withMessage('dueDate is required.'),
];

module.exports = { attendanceValidator, assessmentValidator, assignmentValidator };
