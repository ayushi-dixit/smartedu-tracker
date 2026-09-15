const { body } = require('express-validator');

const registerValidator = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('role').optional().isIn(['STUDENT', 'FACULTY', 'ADMIN']).withMessage('Role must be STUDENT, FACULTY, or ADMIN.'),
  body('fullName').notEmpty().withMessage('Full name is required.'),
];

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = { registerValidator, loginValidator };
