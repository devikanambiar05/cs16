const express = require('express');
const router = express.Router();
const { getCategories, getFAQsByCategory } = require('../controllers/categoryController');
const { optionalAuth } = require('../middleware/auth');

// Get all categories
router.get('/', getCategories);

// Get FAQs by category tag
router.get('/:tag/faqs', optionalAuth, getFAQsByCategory);

module.exports = router;