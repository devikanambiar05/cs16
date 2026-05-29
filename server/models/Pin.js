const mongoose = require('mongoose');

const pinSchema = new mongoose.Schema({
  // 'faq' | 'announcement' | 'overview'
  type: {
    type: String,
    enum: ['faq', 'announcement', 'overview'],
    required: true
  },
  // For type 'faq' — reference to the pinned FAQ
  faqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ',
    default: null
  },
  // For type 'announcement' or 'overview' — the text content
  content: {
    type: String,
    default: null
  },
  // Display title for the pin
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  // Admin who created this pin
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Order among active pins (lower = shown first)
  order: {
    type: Number,
    default: 0
  },
  // Soft delete — removed pins are hidden but kept for audit
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

pinSchema.index({ type: 1, deletedAt: 1, order: 1 });

module.exports = mongoose.model('Pin', pinSchema);
