const User = require('../models/User');

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const users = await User.find({ status: 'active' })
      .select('name reputation questionsAsked answersGiven role')
      .sort({ reputation: -1 })
      .limit(parseInt(limit));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name reputation questionsAsked answersGiven role createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update own profile
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;

    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};