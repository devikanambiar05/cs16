const express = require('express');
const router = express.Router();
const { getQueries, getQueryById, createQuery, closeQuery, deleteQuery } = require('../controllers/queryController');
const { protect, optionalAuth } = require('../middleware/auth');

// Get all queries (public)
router.get('/', optionalAuth, getQueries);

// Create query (authenticated)
router.post('/', protect, createQuery);

// Get single query with answers (public)
router.get('/:id', optionalAuth, getQueryById);

// Close query (owner or admin)
router.patch('/:id/close', protect, closeQuery);

// Delete query (owner only)
router.delete('/:id', protect, deleteQuery);

module.exports = router;