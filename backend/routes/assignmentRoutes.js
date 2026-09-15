const express = require('express');
const { addAssignment, getAssignmentsForStudent, updateAssignment } = require('../controllers/assignmentController');
const { assignmentValidator } = require('../validators/academicValidator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requireRole('FACULTY', 'ADMIN'), assignmentValidator, validate, addAssignment);
router.get('/student/:studentId', getAssignmentsForStudent);
router.put('/:id', requireRole('FACULTY', 'ADMIN'), updateAssignment);

module.exports = router;
