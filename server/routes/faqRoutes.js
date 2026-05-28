const express = require('express');
const router = express.Router();
const { getFAQs, getTrending, getFAQById, upvoteFAQ, createFAQ } = require('../controllers/faqController');
const { protect, optionalAuth } = require('../middleware/auth');

// Public - get all FAQs
router.get('/', optionalAuth, getFAQs);

// Public - trending FAQs
router.get('/trending', getTrending);

// Create FAQ (authenticated)
router.post('/', protect, createFAQ);

// Upvote FAQ (authenticated)
router.post('/:id/upvote', protect, upvoteFAQ);

// Get single FAQ
router.get('/:id', optionalAuth, getFAQById);

module.exports = router;