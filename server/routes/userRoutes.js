const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public - leaderboard
router.get('/leaderboard', getLeaderboard);

// Public - user profile
router.get('/:id', getUserProfile);

// Protected - update own profile
router.put('/profile', protect, updateProfile);

module.exports = router;