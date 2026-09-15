const express = require('express');
const { listSubjects, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', listSubjects); // all authenticated roles may read subjects
router.post('/', requireRole('ADMIN'), createSubject);
router.put('/:id', requireRole('ADMIN'), updateSubject);
router.delete('/:id', requireRole('ADMIN'), deleteSubject);

module.exports = router;
