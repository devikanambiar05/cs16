const express = require('express');
const router = express.Router();
const { ragChat } = require('../controllers/ragController');
const { optionalAuth } = require('../middleware/auth');

// POST /api/rag/chat — RAG-powered FAQ chat
router.post('/chat', optionalAuth, ragChat);

module.exports = router;