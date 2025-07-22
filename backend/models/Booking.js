const mongoose = require("mongoose")
const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true, 
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    serviceProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Service provider is required"],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service is required"],
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    timeSlot: {
      start: {
        type: String,
        required: [true, "Start time is required"],
      },
      end: {
        type: String,
        required: [true, "End time is required"],
      },
    },
    location: {
      residence: { type: String, required: [true, "Residence is required"] },
      accessInstructions: String,
      contactPerson: {
        name: String,
        phone: String,
      },
    },
    serviceDetails: {
      wasteType: [String],
      estimatedWeight: Number,
      estimatedVolume: Number,
      specialRequirements: String,
      images: [String], // URLs to uploaded images
      additionalNotes: String,
    },
    pricing: {
      baseAmount: {
        type: Number,
        required: [true, "Base amount is required"],
      },
      additionalFees: [
        {
          name: String,
          amount: Number,
          description: String,
        },
      ],
      discount: {
        amount: { type: Number, default: 0 },
        reason: String,
      },
      tax: {
        amount: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
      },
      totalAmount: {
        type: Number,
        required: [true, "Total amount is required"],
      },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "rescheduled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        notes: String,
      },
    ],
    payment: {
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded", "partial"],
        default: "pending",
      },
      method: {
        type: String,
        enum: ["card", "cash", "bank_transfer", "digital_wallet"],
      },
      transactionId: String,
      paidAmount: { type: Number, default: 0 },
      paidAt: Date,
      refundAmount: { type: Number, default: 0 },
      refundedAt: Date,
    },
    communication: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["message", "system", "status_update"],
          default: "message",
        },
      },
    ],
    rating: {
      customerRating: {
        score: { type: Number, min: 1, max: 5 },
        review: String,
        ratedAt: Date,
      },
      providerRating: {
        score: { type: Number, min: 1, max: 5 },
        review: String,
        ratedAt: Date,
      },
    },
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
    },
    reschedule: {
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      originalDate: Date,
      newDate: Date,
      reason: String,
      rescheduledAt: Date,
    },
    tracking: {
      serviceStarted: Date,
      serviceCompleted: Date,
      providerLocation: {
        latitude: Number,
        longitude: Number,
        lastUpdated: Date,
      },
      estimatedArrival: Date,
      route: [
        {
          latitude: Number,
          longitude: Number,
          timestamp: Date,
        },
      ],
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
bookingSchema.index({ customer: 1, createdAt: -1 })
bookingSchema.index({ serviceProvider: 1, scheduledDate: 1 })
bookingSchema.index({ status: 1, scheduledDate: 1 })
// Pre-save middleware to generate booking number
bookingSchema.pre("save", async function (next) {
  if (!this.bookingNumber) {
    const count = await this.constructor.countDocuments()
    this.bookingNumber = `TL${Date.now()}${String(count + 1).padStart(4, "0")}`
    console.log("Generated bookingNumber:", this.bookingNumber)
  }
  next()
})

// Method to calculate total amount
bookingSchema.methods.calculateTotal = function () {
  let total = this.pricing.baseAmount

  // Add additional fees
  if (this.pricing.additionalFees) {
    total += this.pricing.additionalFees.reduce((sum, fee) => sum + fee.amount, 0)
  }

  // Apply discount
  total -= this.pricing.discount.amount

  // Add tax
  total += this.pricing.tax.amount

  this.pricing.totalAmount = Math.max(0, total)
  return this.pricing.totalAmount
}

// Method to update status with history
bookingSchema.methods.updateStatus = function (newStatus, updatedBy, reason, notes) {
  this.statusHistory.push({
    status: this.status,
    updatedBy,
    reason,
    notes,
  })
  this.status = newStatus
}

module.exports = mongoose.model("Booking", bookingSchema)
