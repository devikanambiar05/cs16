const express = require('express');
const router = express.Router();
const { getQueries, getQueryById, createQuery, closeQuery, deleteQuery, takeQuery, claimQuery, unclaimQuery, getSlaStats, updateQuery, getCommunityCandidates } = require('../controllers/queryController');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all queries (public)
router.get('/', optionalAuth, getQueries);

// Take a query (auto-assign)
router.post('/take', protect, takeQuery);

// Claim a specific query (browse & pick)
router.post('/:id/claim', protect, claimQuery);

// Release a claimed query
router.delete('/:id/claim', protect, unclaimQuery);

// Create query (authenticated)
router.post('/', protect, createQuery);

// Get single query with answers (public)
router.get('/sla/stats', protect, getSlaStats);

router.get('/community-candidates', getCommunityCandidates);
router.get('/sla/stale-claims', protect, adminOnly, async (req, res) => {
  try {
    const AdminController = require('../controllers/adminController');
    const handler = AdminController.autoReleaseStaleClaims;
    if (typeof handler === 'function') {
      return handler(req, res);
    }
    res.status(501).json({ error: 'Not implemented' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/:id', optionalAuth, getQueryById);

// Update query (owner only — PUT before wildcard /:id)
router.put('/:id', protect, updateQuery);

// Close query (owner or admin)
router.patch('/:id/close', protect, closeQuery);

// Delete query (owner only)
router.delete('/:id', protect, deleteQuery);

module.exports = router;