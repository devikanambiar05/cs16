const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['open', 'claimed', 'answered', 'closed'],
    default: 'open'
  },
  // Who claimed this query (null = open for anyone)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  claimedAt: {
    type: Date,
    default: null
  },
  // Tracks last substantive activity by the claim holder
  lastActivityAt: {
    type: Date,
    default: null
  },
  // SLA warning sent at (one-time warning before auto-release)
  warningSentAt: {
    type: Date,
    default: null
  },
  // SLA: when this query's 24hr window expires
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  // When the query was escalated (first SLA breach)
  escalatedAt: {
    type: Date,
    default: null
  },
  // Number of times SLA has been breached
  escalationCount: {
    type: Number,
    default: 0
  },
  // When it got an accepted answer
  answeredAt: {
    type: Date,
    default: null
  },
  resolvedFAQ: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ',
    default: null
  },
  answerCount: {
    type: Number,
    default: 0
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

querySchema.index({ status: 1, expiresAt: 1 });
querySchema.index({ assignedTo: 1 });
querySchema.index({ createdBy: 1 });
querySchema.index({ tags: 1 });
querySchema.index({ expiresAt: 1, status: 1 }); // For SLA cron

module.exports = mongoose.model('Query', querySchema);