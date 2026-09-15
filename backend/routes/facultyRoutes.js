const express = require('express');
const { listFaculty, getFacultyById, createFaculty, updateFaculty } = require('../controllers/facultyController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', requireRole('ADMIN'), listFaculty);
router.get('/:id', requireRole('ADMIN', 'FACULTY'), getFacultyById);
router.post('/', requireRole('ADMIN'), createFaculty);
router.put('/:id', requireRole('ADMIN'), updateFaculty);

module.exports = router;
