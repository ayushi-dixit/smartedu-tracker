const express = require('express');
const { simulateRisk } = require('../controllers/simulatorController');
const { simulatorValidator } = require('../validators/studentValidator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/risk', simulatorValidator, validate, simulateRisk);

module.exports = router;
