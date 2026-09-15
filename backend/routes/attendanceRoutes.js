const express = require('express');
const { addAttendance, getAttendanceForStudent, updateAttendance } = require('../controllers/attendanceController');
const { attendanceValidator } = require('../validators/academicValidator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requireRole('FACULTY', 'ADMIN'), attendanceValidator, validate, addAttendance);
router.get('/student/:studentId', getAttendanceForStudent);
router.put('/:id', requireRole('FACULTY', 'ADMIN'), updateAttendance);

module.exports = router;
