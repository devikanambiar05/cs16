const User = require('../models/User');
const FAQ = require('../models/FAQ');
const Query = require('../models/Query');
const Answer = require('../models/Answer');

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

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    res.json({ users, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Admin: Ban/Unban user
exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot ban an admin' });

    user.status = user.status === 'banned' ? 'active' : 'banned';
    await user.save();
    res.json({ message: user.status === 'banned' ? 'User banned' : 'User unbanned', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Admin: Get admin stats dashboard
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalFAQs, totalQueries, totalAnswers, openQueries, answeredQueries, recentQueries] = await Promise.all([
      User.countDocuments(),
      FAQ.countDocuments({ status: 'resolved' }),
      Query.countDocuments(),
      Answer.countDocuments(),
      Query.countDocuments({ status: 'open' }),
      Query.countDocuments({ status: 'answered' }),
      Query.find().populate('createdBy', 'name').sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      totalUsers,
      totalFAQs,
      totalQueries,
      totalAnswers,
      openQueries,
      answeredQueries,
      recentQueries
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};