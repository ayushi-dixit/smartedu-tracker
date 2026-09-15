const express = require('express');
const { importStudents } = require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { uploadCsv } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/students', requireRole('FACULTY', 'ADMIN'), uploadCsv.single('file'), importStudents);

module.exports = router;
