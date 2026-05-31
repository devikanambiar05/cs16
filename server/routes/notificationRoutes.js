const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Get all notifications
router.get('/', protect, getNotifications);

// Mark specific notification as read
router.patch('/:id/read', protect, markAsRead);

// Mark all notifications as read
router.patch('/read-all', protect, markAllAsRead);

module.exports = router;
