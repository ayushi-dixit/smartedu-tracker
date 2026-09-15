const express = require('express');
const { addAssessment, getAssessmentsForStudent, updateAssessment } = require('../controllers/assessmentController');
const { assessmentValidator } = require('../validators/academicValidator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requireRole('FACULTY', 'ADMIN'), assessmentValidator, validate, addAssessment);
router.get('/student/:studentId', getAssessmentsForStudent);
router.put('/:id', requireRole('FACULTY', 'ADMIN'), updateAssessment);

module.exports = router;
