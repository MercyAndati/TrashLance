const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    // Points for gamification/leaderboard
    points: {
      type: Number,
      default: 0,
    },
    // Rating system for collectors
    ratings: [
      {
        star: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        citizenId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ratedAt: { type: Date, default: Date.now },
      },
    ],
    role: {
      type: String,
      enum: ["customer", "service_provider", "admin", "government"],
      default: "customer",
    },
    avatar: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,

    // Service Provider specific fields
    serviceProvider: {
      companyName: String,
      businessLicense: String,
      rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
      },
      servicesOffered: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
      ],
      subscription: {
        plan: {
          type: String,
          enum: ["Free", "Standard", "Premium"],
          default: "Free",
        },
        startDate: Date,
        endDate: Date,
      },
      workingHours: {
        monday: { start: String, end: String, available: Boolean },
        tuesday: { start: String, end: String, available: Boolean },
        wednesday: { start: String, end: String, available: Boolean },
        thursday: { start: String, end: String, available: Boolean },
        friday: { start: String, end: String, available: Boolean },
        saturday: { start: String, end: String, available: Boolean },
        sunday: { start: String, end: String, available: Boolean },
      },
      serviceRadius: {
        type: Number,
        default: 10, // kilometers
      },
      serviceLocations: {
        type: String,
        trim: true,
        maxlength: [500, "Service locations cannot exceed 500 characters"]
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      documents: [
        {
          type: String,
          url: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
)

// Index for geospatial queries
userSchema.index({ "address.coordinates": "2dsphere" })

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject()
  delete user.password
  delete user.emailVerificationToken
  delete user.emailVerificationExpires
  delete user.passwordResetToken
  delete user.passwordResetExpires
  delete user.phoneVerificationCode
  delete user.phoneVerificationExpires
  return user
}

module.exports = mongoose.model("User", userSchema)
