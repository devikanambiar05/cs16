const Query = require('../models/Query');
const Answer = require('../models/Answer');
const FAQ = require('../models/FAQ');
const User = require('../models/User');

// Get all queries with filters
exports.getQueries = async (req, res) => {
  try {
    const { status, tag, sort = 'recent', page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (tag) query.tags = tag.toLowerCase();

    let sortOption = {};
    if (sort === 'popular') {
      sortOption = { answerCount: -1, createdAt: -1 };
    } else if (sort === 'unanswered') {
      query.answerCount = 0;
      sortOption = { createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [queries, total] = await Promise.all([
      Query.find(query)
        .populate('createdBy', 'name reputation')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Query.countDocuments(query)
    ]);

    res.json({
      queries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get queries error:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
};

// Get single query with its answers
exports.getQueryById = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate('createdBy', 'name reputation')
      .populate('resolvedFAQ');

    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    // Get answers for this query
    const answers = await Answer.find({ queryId: query._id })
      .populate('userId', 'name reputation')
      .sort({ isAccepted: -1, upvotes: -1, createdAt: -1 });

    res.json({ query, answers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch query' });
  }
};

// Raise a new query
exports.createQuery = async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const query = new Query({
      title,
      description,
      tags: tags ? tags.map(t => t.toLowerCase().trim()) : [],
      createdBy: req.user._id
    });

    await query.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { questionsAsked: 1 }
    });

    // Note: Similar FAQ detection would go here (optional - semantic search)
    res.status(201).json(query);
  } catch (error) {
    console.error('Create query error:', error);
    res.status(500).json({ error: 'Failed to create query' });
  }
};

// Close a query (only by owner or admin)
exports.closeQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    // Only owner or admin can close
    if (query.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    query.status = 'closed';
    await query.save();

    res.json(query);
  } catch (error) {
    res.status(500).json({ error: 'Failed to close query' });
  }
};

// Delete a query (only by owner)
exports.deleteQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    if (query.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await query.deleteOne();

    // Also delete associated answers
    await Answer.deleteMany({ queryId: query._id });

    res.json({ message: 'Query deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete query' });
  }
};