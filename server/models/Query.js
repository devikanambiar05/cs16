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
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Cached answer count
  answerCount: {
    type: Number,
    default: 0
  },
  // Accepted answer (converted to FAQ)
  resolvedFAQ: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  }
}, {
  timestamps: true
});

// Text index for search
querySchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Query', querySchema);