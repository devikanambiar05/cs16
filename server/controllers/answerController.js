const Answer = require('../models/Answer');
const Query = require('../models/Query');
const FAQ = require('../models/FAQ');
const User = require('../models/User');

// ─── Submit an answer ──────────────────────────────────────────────────────────

exports.createAnswer = async (req, res) => {
  try {
    const { content, queryId } = req.body;

    if (!content || !queryId) {
      return res.status(400).json({ error: 'Content and queryId are required' });
    }

    const query = await Query.findById(queryId);
    if (!query) return res.status(404).json({ error: 'Query not found' });
    if (query.status === 'closed') return res.status(400).json({ error: 'This query is closed' });
    if (query.answerCount >= 5) return res.status(400).json({ error: 'This query already has 5 answers' });

    const answer = await Answer.create({
      content,
      queryId,
      userId: req.user._id
    });

    query.answerCount = (query.answerCount || 0) + 1;
    if (query.answerCount === 1) query.status = 'answered';
    // Refresh activity window on the query when claim-holder submits an answer
    query.lastActivityAt = new Date();
    await query.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { answersGiven: 1 } });

    await answer.populate('userId', 'name reputation');

    res.status(201).json({ message: 'Answer added', answer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// ─── Get answers for a query ──────────────────────────────────────────────────

exports.getAnswers = async (req, res) => {
  try {
    const answers = await Answer.find({ queryId: req.params.queryId })
      .populate('userId', 'name reputation tags')
      .sort({ upvotes: -1, createdAt: 1 });
    res.json({ answers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
};

// ─── Upvote an answer (toggle) ─────────────────────────────────────────────────

exports.upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    const userId = req.user._id;

    if (answer.upvotedBy.includes(userId)) {
      // Remove upvote
      answer.upvotes -= 1;
      answer.upvotedBy = answer.upvotedBy.filter(id => id.toString() !== userId.toString());
      // Reverse the +2rep awarded on upvote
      await User.findByIdAndUpdate(answer.userId, { $inc: { reputation: -2 } });
    } else {
      // Add upvote
      answer.upvotes += 1;
      answer.upvotedBy.push(userId);
      // +2 rep to answer author per upvote
      await User.findByIdAndUpdate(answer.userId, { $inc: { reputation: 2 } });
      // Also increment community score for auto-FAQ promotion (+3 per upvote)
      await Query.findByIdAndUpdate(answer.queryId, { $inc: { communityScore: 3 } });
    }

    await answer.save();
    // Touch activity window on the query so claim doesn't go stale while there is engagement
    await Query.findByIdAndUpdate(answer.queryId, { lastActivityAt: new Date() });
    res.json({ upvotes: answer.upvotes, upvotedBy: answer.upvotedBy });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote' });
  }
};

// ─── Accept an answer ──────────────────────────────────────────────────────────

exports.acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    const query = await Query.findById(answer.queryId);
    if (!query) return res.status(404).json({ error: 'Query not found' });

    // Only query owner can accept
    if (query.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only query owner can accept an answer' });
    }

    // Unaccept the previously accepted answer (if any)
    const currentAccepted = await Answer.findOne({ queryId: query._id, isAccepted: true });
    if (currentAccepted) {
      currentAccepted.isAccepted = false;
      await currentAccepted.save();

      // Reverse +20 rep from previously accepted answer
      await User.findByIdAndUpdate(currentAccepted.userId, { $inc: { reputation: -20 } });

      // If it was converted to a FAQ, unlink it
      await FAQ.updateMany(
        { resolvedFAQ: currentAccepted._id },
        { $set: { resolvedFAQ: null } }
      );
    }

    // Accept the new answer
    answer.isAccepted = true;
    answer.acceptedAt = new Date();
    await answer.save();

    // Award +20 rep to answer author
    await User.findByIdAndUpdate(answer.userId, { $inc: { reputation: 20 } });

    // Increment acceptedAnswersCount on the User model
    await User.findByIdAndUpdate(answer.userId, { $inc: { acceptedAnswersCount: 1 } });

    // Mark query as answered
    query.status = 'answered';
    query.resolvedFAQ = null;
    await query.save();

    res.json({ message: 'Answer accepted', answer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept answer' });
  }
};

// ─── Convert answer to FAQ ────────────────────────────────────────────────────

exports.convertAnswerToFAQ = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('userId', 'name reputation');
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    const { title, tags, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    // Convert into a public FAQ
    const faq = await FAQ.create({
      title,
      description: description || answer.content,
      finalAnswer: answer.content,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      createdBy: answer.userId._id,
      sourceQuery: answer.queryId,
      status: 'resolved'
    });

    // Mark query as closed/resolved
    await Query.findByIdAndUpdate(answer.queryId, {
      status: 'resolved',
      resolvedFAQ: faq._id
    });

    res.status(201).json({ message: 'FAQ created from answer', faq });
  } catch (error) {
    res.status(500).json({ error: 'Failed to convert to FAQ' });
  }
};

// ─── Edit an answer ───────────────────────────────────────────────────────────

exports.editAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    if (answer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    answer.content = content;
    await answer.save();

    await answer.populate('userId', 'name reputation');

    res.json(answer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit answer' });
  }
};

// ─── Delete an answer (hard delete — reverse all rep effects) ─────────────────

exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    if (answer.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Decrement answer count on query
    const query = await Query.findById(answer.queryId);
    if (query) {
      query.answerCount = Math.max(0, query.answerCount - 1);
      if (query.answerCount === 0) query.status = 'open';
      await query.save();
    }

    // Reverse upvote rep for each upvote (-2 per upvote removed)
    if (answer.upvotes > 0 && answer.upvotedBy && answer.upvotedBy.length > 0) {
      await User.updateMany(
        { _id: { $in: answer.upvotedBy } },
        { $inc: { reputation: -2 } }
      );
    }

    // Reverse accepted answer rep bonus (-20 to author)
    if (answer.isAccepted) {
      await User.findByIdAndUpdate(answer.userId, { $inc: { reputation: -20 } });
      // Also reverse the answer count bonus received on accept
      await User.findByIdAndUpdate(answer.userId, { $inc: { acceptedAnswersCount: -1 } });
    }

    // Reverse upvote community score (+3 per upvote that was removed on answer)
    if (upvotes > 0 && upvotedBy && upvotedBy.length > 0) {
      await Query.findByIdAndUpdate(answer.queryId, { $inc: { communityScore: -(3 * upvotedBy.length) } });
    }

    // Reverse accepted answer community score bonus (+15)
    if (answer.isAccepted) {
      await Query.findByIdAndUpdate(answer.queryId, { $inc: { communityScore: -15 } });
    }

    // Reverse answersGiven counter (set on createAnswer)
    await User.findByIdAndUpdate(answer.userId, { $inc: { answersGiven: -1 } });

    await answer.deleteOne();


    res.json({ message: 'Answer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete answer' });
  }
};
