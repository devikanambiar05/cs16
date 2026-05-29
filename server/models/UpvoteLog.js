const mongoose = require('mongoose');

const upvoteLogSchema = new mongoose.Schema({
  upvoterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for high-speed velocity checks in last 24h
upvoteLogSchema.index({ upvoterId: 1, targetUserId: 1, createdAt: 1 });
upvoteLogSchema.index({ upvoterId: 1, answerId: 1 }, { unique: true });

module.exports = mongoose.model('UpvoteLog', upvoteLogSchema);
