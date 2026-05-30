const express = require('express');
const router = express.Router();
const { ragChat } = require('../controllers/ragController');
const { getSessions, saveSession, getSessionById } = require('../controllers/chatSessionController');
const { protect, optionalAuth } = require('../middleware/auth');

// POST /api/rag/chat — RAG-powered FAQ chat
router.post('/chat', optionalAuth, ragChat);

// Protected session history endpoints
router.get('/sessions', protect, getSessions);
router.post('/sessions', protect, saveSession);
router.get('/sessions/:id', protect, getSessionById);

module.exports = router;