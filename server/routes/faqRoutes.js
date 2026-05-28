const express = require('express');
const router = express.Router();
const { getFAQs, getTrending, getFAQById, upvoteFAQ, createFAQ, convertAnswerToFAQ } = require('../controllers/faqController');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');

// Public - get all FAQs
router.get('/', optionalAuth, getFAQs);

// Public - trending FAQs
router.get('/trending', getTrending);

// Admin - create FAQ manually
router.post('/', protect, adminOnly, createFAQ);

// Admin - convert accepted answer to FAQ
router.post('/from-answer/:answerId', protect, adminOnly, convertAnswerToFAQ);

// Upvote FAQ (authenticated)
router.post('/:id/upvote', protect, upvoteFAQ);

// Get single FAQ
router.get('/:id', optionalAuth, getFAQById);

module.exports = router;