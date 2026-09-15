const express = require('express');
const { getPreferences, updatePreferences, resetPreferences } = require('../controllers/preferenceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getPreferences);
router.put('/', updatePreferences);
router.post('/reset', resetPreferences);

module.exports = router;
