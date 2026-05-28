const Query = require('../models/Query');
const Answer = require('../models/Answer');
const FAQ = require('../models/FAQ');
const User = require('../models/User');

// Get all queries with filters
exports.getQueries = async (req, res) => {
  try {
    const { status, tag, sort = 'recent', page = 1, limit = 20, claimed } = req.query;

    const query = {};
    if (status) query.status = status;
    if (tag) query.tags = tag.toLowerCase();
    if (claimed === 'true') query.assignedTo = { $ne: null };

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
        .populate('assignedTo', 'name reputation')
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

// Claim a query (explicit, browse-and-pick)
exports.claimQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }
    if (query.status === 'closed') {
      return res.status(400).json({ error: 'This query is closed' });
    }
    if (query.assignedTo && query.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(409).json({ error: 'This query has already been claimed by someone else' });
    }
    if (query.assignedTo && query.assignedTo.toString() === req.user._id.toString()) {
      return res.json({ message: 'You already have this query claimed', query });
    }

    // Enforce one active claim per user
    const existing = await Query.findOne({
      assignedTo: req.user._id,
      status: { $ne: 'closed' },
      _id: { $ne: query._id }
    });
    if (existing) {
      return res.status(400).json({
        error: `You can only have one active claim at a time. You currently have: "${existing.title}". Please release it before claiming another.`
      });
    }

    query.assignedTo = req.user._id;
    query.claimedAt = new Date();
    await query.save();

    const populated = await Query.findById(query._id)
      .populate('createdBy', 'name reputation')
      .populate('assignedTo', 'name reputation');

    res.json({ message: 'Query claimed successfully', query: populated });
  } catch (error) {
    console.error('Claim query error:', error);
    res.status(500).json({ error: 'Failed to claim query' });
  }
};

// Release a claimed query (self or admin)
exports.unclaimQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }
    if (!query.assignedTo) {
      return res.json({ message: 'Query is not currently claimed', query });
    }

    const isClaimant = query.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isClaimant && !isAdmin) {
      return res.status(403).json({ error: 'Only the person who claimed this or an admin can release it' });
    }

    query.assignedTo = null;
    query.claimedAt = null;
    await query.save();

    const populated = await Query.findById(query._id)
      .populate('createdBy', 'name reputation')
      .populate('assignedTo', 'name reputation');

    res.json({ message: isAdmin && !isClaimant ? 'Admin released the claim' : 'Claim released', query: populated });
  } catch (error) {
    console.error('Unclaim query error:', error);
    res.status(500).json({ error: 'Failed to release claim' });
  }
};

// Take a Question (Auto-assignment of unresolved query)
exports.takeQuery = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. First find if user already has an active assigned unresolved query
    let existingAssignment = await Query.findOne({
      assignedTo: userId,
      status: { $ne: 'closed' }
    }).populate('createdBy', 'name reputation');

    if (existingAssignment) {
      return res.json({
        message: 'You already have an active assigned question!',
        query: existingAssignment
      });
    }

    // 2. Find an open query created by another user, and not assigned to anyone yet
    let query = await Query.findOne({
      status: 'open',
      createdBy: { $ne: userId },
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).populate('createdBy', 'name reputation');

    // 3. Fallback: find any query created by another user that isn't closed yet
    if (!query) {
      query = await Query.findOne({
        status: { $in: ['open', 'answered'] },
        createdBy: { $ne: userId }
      }).populate('createdBy', 'name reputation');
    }

    if (!query) {
      return res.status(404).json({ error: 'No unresolved community queries available to assign right now.' });
    }

    // 4. Assign to user
    query.assignedTo = userId;
    query.claimedAt = new Date();
    await query.save();

    res.json({
      message: 'Question assigned successfully!',
      query
    });
  } catch (error) {
    console.error('Take query error:', error);
    res.status(500).json({ error: 'Failed to auto-assign a query' });
  }
};