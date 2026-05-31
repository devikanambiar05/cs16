const express = require('express');
const router = express.Router();
const { getCategories, getFAQsByCategory, getCategoryContributors } = require('../controllers/categoryController');
const { optionalAuth } = require('../middleware/auth');

// Get all categories
router.get('/', getCategories);

// Get FAQs by category tag
router.get('/:tag/faqs', optionalAuth, getFAQsByCategory);

// Get top contributors for category
router.get('/:tag/contributors', optionalAuth, getCategoryContributors);

module.exports = router;