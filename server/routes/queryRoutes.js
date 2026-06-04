const express = require('express');
const router = express.Router();
const { getQueries, getQueryById, createQuery, closeQuery, deleteQuery, takeQuery, claimQuery, unclaimQuery, getSlaStats, updateQuery, getCommunityCandidates, toggleFacing } = require('../controllers/queryController');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all queries (public)
router.get('/', optionalAuth, getQueries);

// Take a query (auto-assign)
router.post('/take', protect, takeQuery);

// Claim a specific query (browse & pick)
router.post('/:id/claim', protect, claimQuery);

// Release a claimed query
router.delete('/:id/claim', protect, unclaimQuery);

// Toggle facing count on a query
router.post('/:id/facing', protect, toggleFacing);

// Create query (authenticated)
router.post('/', protect, createQuery);

// Get single query with answers (public)
router.get('/sla/stats', optionalAuth, getSlaStats);

router.get('/community-candidates', getCommunityCandidates);
router.get('/sla/stale-claims', protect, adminOnly, async (req, res) => {
  try {
    const Query = require('../models/Query');
    const Answer = require('../models/Answer');
    const SLA_24HR = 24 * 60 * 60 * 1000;
    const now = new Date();

    const staleClaimed = await Query.find({
      status: 'claimed',
      expiresAt: { $lt: now }
    });

    let actionCount = 0;
    for (const query of staleClaimed) {
      const hasAcceptedAnswer = await Answer.exists({
        queryId: query._id,
        isAccepted: true
      });
      if (!hasAcceptedAnswer) {
        query.assignedTo = null;
        query.claimedAt = null;
        query.status = 'open';
        query.expiresAt = new Date(Date.now() + SLA_24HR);
        query.escalationCount = (query.escalationCount || 0) + 1;
        query.escalatedAt = query.escalatedAt || new Date();
        await query.save();
        actionCount++;
      }
    }
    res.json({ message: `Successfully released ${actionCount} stale claim(s)`, releasedCount: actionCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/:id', optionalAuth, getQueryById);

// Update query (owner only — PUT before wildcard /:id)
router.put('/:id', protect, updateQuery);

// Close query (owner or admin)
router.patch('/:id/close', protect, closeQuery);

// Delete query (admin only)
router.delete('/:id', protect, adminOnly, deleteQuery);

module.exports = router;