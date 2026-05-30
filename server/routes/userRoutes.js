const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserProfile, updateProfile, getAllUsers, banUser, getStats, toggleBookmark, getBookmarks, getLikedFAQs } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin - dashboard stats
router.get('/admin/stats', protect, adminOnly, getStats);

// Admin - all users
router.get('/admin/users', protect, adminOnly, getAllUsers);

// Admin - ban/unban user
router.patch('/:id/ban', protect, adminOnly, banUser);

// Public - leaderboard
router.get('/leaderboard', getLeaderboard);

// Protected - bookmarks (must be before wildcard /:id)
router.get('/bookmarks', protect, getBookmarks);
router.post('/bookmarks/:faqId', protect, toggleBookmark);
router.get('/likes', protect, getLikedFAQs);

// Public - user profile  (wildcard — must be last)
router.get('/:id', getUserProfile);

// Protected - update own profile
router.put('/profile', protect, updateProfile);

module.exports = router;