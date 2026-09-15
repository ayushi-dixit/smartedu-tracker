const express = require('express');
const { getStats, listUsers, setUserStatus } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, requireRole('ADMIN'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.put('/users/:id/status', setUserStatus);

module.exports = router;
