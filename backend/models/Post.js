const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    location: {
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: "Kenya" },
      },
      coordinates: {
        latitude: {
          type: Number,
          required: [true, "Latitude is required"],
          min: [-90, "Invalid latitude"],
          max: [90, "Invalid latitude"],
        },
        longitude: {
          type: Number,
          required: [true, "Longitude is required"],
          min: [-180, "Invalid longitude"],
          max: [180, "Invalid longitude"],
        },
      },
      placeName: String, // Human readable location name
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: String, // Cloudinary public ID for deletion
        caption: String,
      },
    ],
    category: {
      type: String,
      enum: ["illegal_dumping", "overflowing_bins", "littering", "hazardous_waste", "blocked_drainage", "other"],
      default: "illegal_dumping",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["reported", "acknowledged", "in_progress", "completed", "rejected"],
      default: "reported",
    },
    statusHistory: [
      {
        status: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        updatedAt: { type: Date, default: Date.now },
        notes: String,
      },
    ],
    tags: [String],
    upvotes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        votedAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: [300, "Comment cannot exceed 300 characters"],
        },
        createdAt: { type: Date, default: Date.now },
        isOfficial: { type: Boolean, default: false }, // For government/admin responses
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Government user or cleanup team
    },
    estimatedCleanupDate: Date,
    actualCleanupDate: Date,
    cleanupNotes: String,
    isPublic: {
      type: Boolean,
      default: true,
    },
    reportNumber: {
      type: String,
      unique: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
postSchema.index({ "location.coordinates": "2dsphere" })
postSchema.index({ status: 1, createdAt: -1 })
postSchema.index({ author: 1, createdAt: -1 })
postSchema.index({ category: 1, severity: 1 })
postSchema.index({ reportNumber: 1 })

// Add pagination plugin
postSchema.plugin(mongoosePaginate)

// Pre-save middleware to generate report number
postSchema.pre("save", async function (next) {
  if (!this.reportNumber) {
    const count = await this.constructor.countDocuments()
    this.reportNumber = `RP${Date.now()}${String(count + 1).padStart(4, "0")}`
  }
  next()
})

// Method to update status with history
postSchema.methods.updateStatus = function (newStatus, updatedBy, notes) {
  this.statusHistory.push({
    status: this.status,
    updatedBy,
    notes,
  })
  this.status = newStatus

  if (newStatus === "completed") {
    this.actualCleanupDate = new Date()
  }
}

// Method to add upvote
postSchema.methods.toggleUpvote = function (userId) {
  const existingVote = this.upvotes.find((vote) => vote.user.toString() === userId.toString())

  if (existingVote) {
    // Remove upvote
    this.upvotes = this.upvotes.filter((vote) => vote.user.toString() !== userId.toString())
    return false 
  } else {
    // Add upvote
    this.upvotes.push({ user: userId })
    return true 
  }
}

// Virtual for upvote count
postSchema.virtual("upvoteCount").get(function () {
  return this.upvotes.length
})

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments.length
})

module.exports = mongoose.model("Post", postSchema)
