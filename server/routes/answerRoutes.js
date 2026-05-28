const express = require('express');
const router = express.Router();
const { createAnswer, upvoteAnswer, acceptAnswer, editAnswer, deleteAnswer } = require('../controllers/answerController');
const { protect } = require('../middleware/auth');

// Submit answer (authenticated)
router.post('/', protect, createAnswer);

// Upvote answer (authenticated)
router.post('/:id/upvote', protect, upvoteAnswer);

// Accept answer (query owner only)
router.post('/:id/accept', protect, acceptAnswer);

// Edit answer (author only)
router.put('/:id', protect, editAnswer);

// Delete answer (author or admin)
router.delete('/:id', protect, deleteAnswer);

module.exports = router;