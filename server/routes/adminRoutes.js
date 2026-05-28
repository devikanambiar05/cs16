const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  pinFAQ,
  mergeFAQs,
  editFAQFinalAnswer,
  deleteFAQ,
  deleteAnswer,
  deleteQuery,
  getAnalytics,
  getSlaStats,
  rejectAnswer,
  getModerationQueue
} = require('../controllers/adminController');

// ─── FAQ Management ────────────────────────────────────────────────────────────

// Pin/Unpin a FAQ
router.patch('/faqs/:id/pin', protect, adminOnly, pinFAQ);

// Merge two FAQs (sourceId → targetId)
router.post('/faqs/merge', protect, adminOnly, mergeFAQs);

// Edit FAQ finalAnswer (with audit trail)
router.patch('/faqs/:id/final-answer', protect, adminOnly, editFAQFinalAnswer);

// Soft-delete / Restore a FAQ
router.patch('/faqs/:id', protect, adminOnly, deleteFAQ);

// ─── Answer Management ────────────────────────────────────────────────────────

// Soft-delete / Restore any answer
router.patch('/answers/:id', protect, adminOnly, deleteAnswer);

// Reject (hard delete equivalent via soft-delete) an answer
router.patch('/answers/:id/reject', protect, adminOnly, rejectAnswer);

// ─── Query Management ─────────────────────────────────────────────────────────

// Soft-delete / Restore any query
router.patch('/queries/:id', protect, adminOnly, deleteQuery);

// ─── Analytics & Stats ─────────────────────────────────────────────────────────

// Full analytics dashboard
router.get('/analytics', protect, adminOnly, getAnalytics);

// SLA-specific stats
router.get('/sla-stats', protect, adminOnly, getSlaStats);

// Moderation queue (pending FAQ requests + SLA-breached queries)
router.get('/moderation', protect, adminOnly, getModerationQueue);

module.exports = router;
