const express = require('express');
const { createIntervention, listInterventionsForStudent, updateIntervention } = require('../controllers/interventionController');
const { interventionValidator } = require('../validators/studentValidator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requireRole('FACULTY', 'ADMIN'), interventionValidator, validate, createIntervention);
router.get('/student/:studentId', listInterventionsForStudent);
router.put('/:id', requireRole('FACULTY', 'ADMIN'), updateIntervention);

module.exports = router;
