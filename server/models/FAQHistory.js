const mongoose = require('mongoose');

const faqHistorySchema = new mongoose.Schema({
  faq: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ',
    required: true
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot before edit
  previousTitle: String,
  previousDescription: String,
  previousFinalAnswer: String,
  previousTags: [String],
  // New values
  newTitle: String,
  newDescription: String,
  newFinalAnswer: String,
  newTags: [String],
  // Why it was changed
  reason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

faqHistorySchema.index({ faq: 1, createdAt: -1 });
faqHistorySchema.index({ editedBy: 1 });

module.exports = mongoose.model('FAQHistory', faqHistorySchema);
