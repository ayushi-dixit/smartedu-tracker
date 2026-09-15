const express = require('express');
const { listStudents, getStudentById, createStudent, updateStudent } = require('../controllers/studentController');
const { studentValidator } = require('../validators/studentValidator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', requireRole('FACULTY', 'ADMIN'), listStudents);
router.get('/:id', getStudentById); // fine-grained access checked in controller
router.post('/', requireRole('ADMIN'), studentValidator, validate, createStudent);
router.put('/:id', requireRole('FACULTY', 'ADMIN'), updateStudent);

module.exports = router;
