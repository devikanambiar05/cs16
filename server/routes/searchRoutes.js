const express = require('express');
const router = express.Router();
const { searchSimilar, getTagSuggestions, detectTags } = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');

router.get('/similar', optionalAuth, searchSimilar);
router.get('/tags', optionalAuth, getTagSuggestions);
router.get('/detect-tags', optionalAuth, detectTags);

module.exports = router;