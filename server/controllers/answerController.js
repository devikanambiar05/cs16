const Answer = require('../models/Answer');
const Query = require('../models/Query');
const FAQ = require('../models/FAQ');
const User = require('../models/User');

// Submit an answer to a query
exports.createAnswer = async (req, res) => {
  try {
    const { content, queryId } = req.body;

    if (!content || !queryId) {
      return res.status(400).json({ error: 'Content and queryId are required' });
    }

    // Check query exists and is open
    const query = await Query.findById(queryId);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }
    if (query.status === 'closed') {
      return res.status(400).json({ error: 'This query is closed' });
    }
    if (query.answerCount >= 5) {
      return res.status(400).json({ error: 'This query already has the maximum of 5 answers. Please take another question!' });
    }

    const answer = new Answer({
      content,
      queryId,
      userId: req.user._id
    });

    await answer.save();

    // Update query answer count and status
    query.answerCount += 1;
    if (query.status === 'open') {
      query.status = 'answered';
    }
    await query.save();

    // Update user stats (+1 answer given)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { answersGiven: 1 }
    });

    const populatedAnswer = await Answer.findById(answer._id)
      .populate('userId', 'name reputation');

    res.status(201).json(populatedAnswer);
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// Upvote an answer
exports.upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const userId = req.user._id;

    // Toggle upvote
    if (answer.upvotedBy.includes(userId)) {
      answer.upvotes -= 1;
      answer.upvotedBy = answer.upvotedBy.filter(id => id.toString() !== userId.toString());
    } else {
      answer.upvotes += 1;
      answer.upvotedBy.push(userId);

      // Increase author reputation (+2 per upvote)
      await User.findByIdAndUpdate(answer.userId, {
        $inc: { reputation: 2 }
      });
    }

    await answer.save();

    res.json({
      upvotes: answer.upvotes,
      hasUpvoted: answer.upvotedBy.includes(userId)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote answer' });
  }
};

// Mark answer as accepted (only query owner)
exports.acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const query = await Query.findById(answer.queryId);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    // Only query owner can accept
    if (query.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the query owner can accept an answer' });
    }

    // Unaccept any previously accepted answer
    await Answer.updateMany(
      { queryId: query._id, isAccepted: true },
      { isAccepted: false }
    );

    // Accept this answer
    answer.isAccepted = true;
    answer.acceptedAt = new Date();
    await answer.save();

    // Update query status
    query.status = 'closed';
    await query.save();

    // Give reputation bonus to answer author
    await User.findByIdAndUpdate(answer.userId, {
      $inc: { reputation: 20 } // +20 for accepted answer
    });

    res.json(answer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept answer' });
  }
};

// Edit an answer (only by author)
exports.editAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    answer.content = content;
    await answer.save();

    res.json(answer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit answer' });
  }
};

// Delete an answer (only by author)
exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const query = await Query.findById(answer.queryId);
    if (query) {
      query.answerCount = Math.max(0, query.answerCount - 1);
      if (query.answerCount === 0) query.status = 'open';
      await query.save();
    }

    await answer.deleteOne();

    res.json({ message: 'Answer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete answer' });
  }
};