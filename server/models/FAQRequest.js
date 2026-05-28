const mongoose = require('mongoose');

const faqRequestSchema = new mongoose.Schema({
  // Which community query this came from
  queryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Query',
    required: true
  },
  // The answer this request is based on
  answerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    required: true
  },
  // Who submitted this request
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The proposed FAQ content
  proposedQuestion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  proposedAnswer: {
    type: String,
    required: true
  },
  proposedTags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Admin review
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

faqRequestSchema.index({ status: 1 });
faqRequestSchema.index({ submittedBy: 1 });

module.exports = mongoose.model('FAQRequest', faqRequestSchema);