const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserProfile, updateProfile, getAllUsers, banUser, getStats } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// Public - leaderboard
router.get('/leaderboard', getLeaderboard);

// Public - user profile
router.get('/:id', getUserProfile);

// Protected - update own profile
router.put('/profile', protect, updateProfile);

// Admin - dashboard stats
router.get('/admin/stats', protect, adminOnly, getStats);

// Admin - all users
router.get('/admin/users', protect, adminOnly, getAllUsers);

// Admin - ban/unban user
router.patch('/:id/ban', protect, adminOnly, banUser);

module.exports = router;