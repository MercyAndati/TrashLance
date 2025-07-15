const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required']
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer is required']
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee is required']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service reference is required']
  },
  rating: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  review: {
    title: {
      type: String,
      maxlength: [100, 'Review title cannot exceed 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
      maxlength: [1000, 'Review content cannot exceed 1000 characters']
    },
    pros: [String],
    cons: [String]
  },
  images: [{
    url: String,
    caption: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  helpfulVotes: {
    count: { type: Number, default: 0 },
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      helpful: Boolean,
      votedAt: { type: Date, default: Date.now }
    }]
  },
  response: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  flags: [{
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: { type: Date, default: Date.now },
    description: String
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'removed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Ensure one review per booking per user
reviewSchema.index({ booking: 1, reviewer: 1 }, { unique: true });

// Index for efficient queries
reviewSchema.index({ reviewee: 1, status: 1, createdAt: -1 });
reviewSchema.index({ service: 1, status: 1, 'rating.overall': -1 });

// Virtual for average rating calculation
reviewSchema.virtual('averageRating').get(function() {
  const ratings = this.rating;
  const ratingKeys = ['punctuality', 'quality', 'communication', 'value'].filter(key => ratings[key]);
  
  if (ratingKeys.length === 0) return ratings.overall;
  
  const sum = ratingKeys.reduce((total, key) => total + ratings[key], 0);
  return Math.round((sum / ratingKeys.length) * 10) / 10;
});

// Method to mark as helpful
reviewSchema.methods.markHelpful = function(userId, helpful) {
  const existingVote = this.helpfulVotes.voters.find(
    vote => vote.user.toString() === userId.toString()
  );
  
  if (existingVote) {
    existingVote.helpful = helpful;
  } else {
    this.helpfulVotes.voters.push({ user: userId, helpful });
  }
  
  // Recalculate count
  this.helpfulVotes.count = this.helpfulVotes.voters.filter(vote => vote.helpful).length;
};

module.exports = mongoose.model('Review', reviewSchema);