const express = require('express');
const { listNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', listNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);

module.exports = router;
