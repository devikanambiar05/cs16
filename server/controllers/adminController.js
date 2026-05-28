const FAQ = require('../models/FAQ');
const Query = require('../models/Query');
const Answer = require('../models/Answer');
const FAQRequest = require('../models/FAQRequest');
const User = require('../models/User');

// ─── FAQ History (for audit trail) ────────────────────────────────────────────

const FAQHistory = require('../models/FAQHistory');

// ─── Pin / Unpin FAQ ──────────────────────────────────────────────────────────

exports.pinFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    faq.pinned = faq.pinned ? false : true;
    await faq.save();

    res.json({ message: faq.pinned ? 'FAQ pinned' : 'FAQ unpinned', pinned: faq.pinned });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pin status' });
  }
};

// ─── Merge FAQs ────────────────────────────────────────────────────────────────

exports.mergeFAQs = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'sourceId and targetId are required' });
    }
    if (sourceId === targetId) {
      return res.status(400).json({ error: 'Cannot merge a FAQ with itself' });
    }

    const sourceFAQ = await FAQ.findById(sourceId);
    const targetFAQ = await FAQ.findById(targetId);
    if (!sourceFAQ || !targetFAQ) {
      return res.status(404).json({ error: 'One or both FAQs not found' });
    }

    // Merge tags (deduplicate, lowercase)
    const mergedTags = [...new Set([
      ...(sourceFAQ.tags || []),
      ...(targetFAQ.tags || [])
    ].map(t => t.toLowerCase()))];

    // Move related FAQs from source into target
    const sourceRelated = sourceFAQ.relatedFAQs || [];
    const targetRelated = targetFAQ.relatedFAQs || [];
    const allRelated = [...new Set([...sourceRelated, ...targetRelated])];

    // Update target FAQ
    targetFAQ.tags = mergedTags;
    targetFAQ.relatedFAQs = allRelated;
    // Take the best title and description between the two
    if (sourceFAQ.title !== targetFAQ.title) {
      targetFAQ.title = `${targetFAQ.title} / ${sourceFAQ.title}`;
    }
    if (sourceFAQ.description !== targetFAQ.description) {
      targetFAQ.description = [targetFAQ.description, sourceFAQ.description]
        .filter(Boolean)
        .join(' || ');
    }
    // Log source as merged into target
    targetFAQ.mergedFrom = sourceFAQ._id;
    await targetFAQ.save();

    // Soft-delete the source FAQ (as duplicate)
    sourceFAQ.status = 'duplicate';
    sourceFAQ.mergedInto = targetFAQ._id;
    sourceFAQ.duplicateOf = targetFAQ._id;
    await sourceFAQ.save();

    // Update any related FAQ refs pointing to source → point to target
    await FAQ.updateMany(
      { relatedFAQs: sourceFAQ._id },
      { $addToSet: { relatedFAQs: targetFAQ._id } }
    );

    res.json({
      message: 'FAQs merged successfully',
      mergedFAQ: targetFAQ,
      duplicateFAQ: sourceFAQ
    });
  } catch (error) {
    console.error('Merge FAQs error:', error);
    res.status(500).json({ error: 'Failed to merge FAQs' });
  }
};

// ─── Edit FAQ finalAnswer (with audit trail) ──────────────────────────────────

exports.editFAQFinalAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalAnswer, reason } = req.body;
    if (!finalAnswer) return res.status(400).json({ error: 'finalAnswer is required' });

    const faq = await FAQ.findById(id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    // Store history snapshot before update
    const history = new FAQHistory({
      faq: faq._id,
      editedBy: req.user._id,
      previousTitle: faq.title,
      previousDescription: faq.description,
      previousFinalAnswer: faq.finalAnswer,
      previousTags: [...(faq.tags || [])],
      newTitle: faq.title,
      newDescription: faq.description,
      newFinalAnswer: finalAnswer,
      newTags: [...(faq.tags || [])],
      reason: reason || 'admin edit'
    });
    await history.save();

    // Apply update
    faq.finalAnswer = finalAnswer;
    await faq.save();

    res.json({ message: 'FAQ updated', faq, history });
  } catch (error) {
    console.error('Edit FAQ error:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
};

// ─── Delete / Restore FAQ ──────────────────────────────────────────────────────

exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    if (faq.deletedAt) {
      // Restore
      faq.deletedAt = null;
      faq.status = 'resolved';
      await faq.save();
      return res.json({ message: 'FAQ restored', faq });
    }

    // Soft-delete
    faq.deletedAt = new Date();
    faq.status = 'deleted';
    await faq.save();
    res.json({ message: 'FAQ deleted', faq });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
};

// ─── Delete any Answer ─────────────────────────────────────────────────────────

exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    if (answer.deletedAt) {
      // Restore
      answer.deletedAt = null;
      await answer.save();
      return res.json({ message: 'Answer restored', answer });
    }

    // Soft-delete
    answer.deletedAt = new Date();
    await answer.save();

    // Update query answer count
    const query = await Query.findById(answer.queryId);
    if (query) {
      query.answerCount = Math.max(0, (query.answerCount || 1) - 1);
      if (query.answerCount === 0) query.status = 'open';
      await query.save();
    }

    res.json({ message: 'Answer deleted', answer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete answer' });
  }
};

// ─── Delete any Query ────────────────────────────────────────────────────────────

exports.deleteQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Query not found' });

    if (query.deletedAt) {
      query.deletedAt = null;
      await query.save();
      return res.json({ message: 'Query restored', query });
    }

    query.deletedAt = new Date();
    query.status = 'closed';
    await query.save();

    res.json({ message: 'Query deleted', query });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete query' });
  }
};

// ─── Analytics ──────────────────────────────────────────────────────────────────

exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalFAQs, totalQueries, totalAnswers, totalUsers,
      newFAQsThisMonth, newQueriesThisMonth, newAnswersThisMonth,
      newUsersThisMonth,
      openQueries, slaBreachedQueries,
      popularTags,
      topContributors
    ] = await Promise.all([
      FAQ.countDocuments({ status: 'resolved', deletedAt: null }),
      Query.countDocuments({ deletedAt: null }),
      Answer.countDocuments({ deletedAt: null }),
      User.countDocuments({ status: { $ne: 'banned' } }),
      FAQ.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, status: 'resolved' }),
      Query.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Answer.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Query.countDocuments({ status: 'open', deletedAt: null }),
      Query.countDocuments({ status: 'open', expiresAt: { $lt: now }, deletedAt: null }),
      FAQ.aggregate([
        { $match: { status: 'resolved', deletedAt: null } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      User.find({ status: 'active' })
        .select('name reputation answersGiven questionsAsked')
        .sort({ reputation: -1 })
        .limit(10)
    ]);

    // Weekly growth percentages
    const [
      newFAQsLastWeek, newQueriesLastWeek, newAnswersLastWeek,
      newUsersLastWeek
    ] = await Promise.all([
      FAQ.countDocuments({ createdAt: { $gte: sevenDaysAgo, $lt: thirtyDaysAgo }, status: 'resolved' }),
      Query.countDocuments({ createdAt: { $gte: sevenDaysAgo, $lt: thirtyDaysAgo } }),
      Answer.countDocuments({ createdAt: { $gte: sevenDaysAgo, $lt: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo, $lt: thirtyDaysAgo } })
    ]);

    const growthRate = (current, previous) => {
      if (!previous) return 100;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      totals: { totalFAQs, totalQueries, totalAnswers, totalUsers },
      monthly: {
        newFAQs: newFAQsThisMonth,
        newQueries: newQueriesThisMonth,
        newAnswers: newAnswersThisMonth,
        newUsers: newUsersThisMonth
      },
      growth: {
        faqs: growthRate(newFAQsThisMonth, newFAQsLastWeek),
        queries: growthRate(newQueriesThisMonth, newQueriesLastWeek),
        answers: growthRate(newAnswersThisMonth, newAnswersLastWeek),
        users: growthRate(newUsersThisMonth, newUsersLastWeek)
      },
      openQueries,
      slaBreachedQueries,
      slaBreachRate: openQueries > 0
        ? Math.round((slaBreachedQueries / openQueries) * 100)
        : 0,
      popularTags,
      topContributors
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// ─── SLA Stats ────────────────────────────────────────────────────────────────

exports.getSlaStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      openQueries,
      claimedQueries,
      answeredQueries,
      closedQueries,
      slaBreached,
      slaBreachWithEscalation,
      avgResolutionHours
    ] = await Promise.all([
      Query.countDocuments({ status: 'open', deletedAt: null }),
      Query.countDocuments({ status: 'claimed', deletedAt: null }),
      Query.countDocuments({ status: 'answered', deletedAt: null }),
      Query.countDocuments({ status: 'closed', deletedAt: null }),
      Query.countDocuments({ status: 'open', expiresAt: { $lt: now }, deletedAt: null }),
      Query.countDocuments({ status: 'open', expiresAt: { $lt: now }, escalationCount: { $gt: 0 }, deletedAt: null }),
      Query.aggregate([
        { $match: { status: 'closed', resolvedFAQ: { $ne: null } } },
        {
          $project: {
            resolutionHours: {
              $divide: [
                { $subtract: ['$answeredAt', '$createdAt'] },
                1000 * 60 * 60
              ]
            }
          }
        },
        { $group: { _id: null, avgResolution: { $avg: '$resolutionHours' } } }
      ])
    ]);

    const totalActive = openQueries + claimedQueries + answeredQueries;
    const resolvedPercent = totalActive > 0
      ? Math.round((closedQueries / (closedQueries + totalActive)) * 100)
      : 0;

    res.json({
      open: openQueries,
      claimed: claimedQueries,
      answered: answeredQueries,
      closed: closedQueries,
      slaBreached,
      slaBreachRate: openQueries > 0 ? Math.round((slaBreached / openQueries) * 100) : 0,
      escalated: slaBreachWithEscalation,
      avgResolutionHours: avgResolutionHours[0]
        ? Math.round(avgResolutionHours[0].avgResolution * 10) / 10
        : null,
      resolvedPercent
    });
  } catch (error) {
    console.error('SLA stats error:', error);
    res.status(500).json({ error: 'Failed to fetch SLA stats' });
  }
};

// ─── Reject answer (admin override) ─────────────────────────────────────────

exports.rejectAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    if (answer.deletedAt) {
      return res.status(400).json({ error: 'Answer is already deleted' });
    }

    answer.deletedAt = new Date();
    await answer.save();

    const query = await Query.findById(answer.queryId);
    if (query) {
      query.answerCount = Math.max(0, (query.answerCount || 1) - 1);
      if (query.answerCount === 0) query.status = 'open';
      await query.save();
    }

    res.json({ message: 'Answer rejected and removed', answer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject answer' });
  }
};

// ─── Pending moderation queue ───────────────────────────────────────────────────

exports.getModerationQueue = async (req, res) => {
  try {
    const [
      pendingFAQRequests,
      pendingQueries,   // queries that are open & unclaimed older than 24h
      recentConflicts   // recently merged or edited FAQs (last 7 days)
    ] = await Promise.all([
      FAQRequest.find({ status: 'pending' })
        .populate('submittedBy', 'name')
        .populate('queryId', 'title')
        .populate('answerId', 'content')
        .sort({ createdAt: -1 }),
      Query.find({
        status: 'open',
        expiresAt: { $lt: new Date() },
        deletedAt: null
      })
        .populate('createdBy', 'name')
        .sort({ expiresAt: 1 })
        .limit(20),
      FAQHistory.find({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        .populate('editedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
    ]);

    res.json({
      pendingFAQRequests,
      slabreachedQueries: pendingQueries,
      recentEdits: recentConflicts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
};
