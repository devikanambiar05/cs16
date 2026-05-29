const express = require('express');
const router = express.Router();
const { getFAQs, getTrending, getFAQById, upvoteFAQ, createFAQ, convertAnswerToFAQ, getPins } = require('../controllers/faqController');
const { getFAQsByCategory } = require('../controllers/categoryController');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');

// Public - get all FAQs
router.get('/', optionalAuth, getFAQs);

// Public - get FAQs by category tag
router.get('/category/:tag', optionalAuth, getFAQsByCategory);

// Public - trending FAQs
router.get('/trending', getTrending);

// Public - get pins (community board cards)
router.get('/pins', getPins);

// Admin - create FAQ manually
router.post('/', protect, adminOnly, createFAQ);

// Admin - convert accepted answer to FAQ
router.post('/from-answer/:answerId', protect, adminOnly, convertAnswerToFAQ);

// Upvote FAQ (authenticated)
router.post('/:id/upvote', protect, upvoteFAQ);

// Get single FAQ
router.get('/:id', optionalAuth, getFAQById);

module.exports = router;