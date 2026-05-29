const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  queryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Query',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  upvotes: {
    type: Number,
    default: 0
  },
  // Users who upvoted
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isAccepted: {
    type: Boolean,
    default: false
  },
  // Only the query owner can mark as accepted
  acceptedAt: {
    type: Date
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isVetted: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Text index for search
answerSchema.index({ content: 'text' });

module.exports = mongoose.model('Answer', answerSchema);