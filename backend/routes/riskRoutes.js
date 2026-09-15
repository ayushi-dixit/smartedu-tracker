const express = require('express');
const { calculateRisk, getCurrent, getHistory } = require('../controllers/riskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/calculate/:studentId', calculateRisk);
router.get('/current/:studentId', getCurrent);
router.get('/history/:studentId', getHistory);

module.exports = router;
