const express = require('express');
const { getExplanation } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/explanation/:studentId', getExplanation);

module.exports = router;
