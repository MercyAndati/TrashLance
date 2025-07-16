const mongoose = require("mongoose")

const pickupZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Zone name is required"],
      trim: true,
      maxlength: [100, "Zone name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    // Geographic boundaries
    boundaries: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
      },
      coordinates: {
        type: [[[Number]]], // Array of arrays of coordinate pairs
        required: true,
      },
    },
    // Center point for distance calculations
    center: {
      latitude: {
        type: Number,
        required: true,
        min: [-90, "Invalid latitude"],
        max: [90, "Invalid latitude"],
      },
      longitude: {
        type: Number,
        required: true,
        min: [-180, "Invalid longitude"],
        max: [180, "Invalid longitude"],
      },
    },
    // Administrative details
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "Kenya",
      trim: true,
    },
    zipCodes: [String], // Associated zip codes

    // Service providers operating in this zone
    serviceProviders: [
      {
        provider: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        services: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
          },
        ],
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Zone statistics
    stats: {
      totalProviders: {
        type: Number,
        default: 0,
      },
      totalServices: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalBookings: {
        type: Number,
        default: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Geospatial index for location queries
pickupZoneSchema.index({ boundaries: "2dsphere" })
pickupZoneSchema.index({ center: "2dsphere" })
pickupZoneSchema.index({ city: 1, state: 1 })
pickupZoneSchema.index({ "serviceProviders.provider": 1 })

// Method to add service provider to zone
pickupZoneSchema.methods.addServiceProvider = function (providerId, serviceIds) {
  const existingProvider = this.serviceProviders.find((sp) => sp.provider.toString() === providerId.toString())

  if (existingProvider) {
    // Update existing provider's services
    serviceIds.forEach((serviceId) => {
      if (!existingProvider.services.includes(serviceId)) {
        existingProvider.services.push(serviceId)
      }
    })
  } else {
    // Add new provider
    this.serviceProviders.push({
      provider: providerId,
      services: serviceIds,
    })
  }

  this.updateStats()
}

// Method to remove service provider from zone
pickupZoneSchema.methods.removeServiceProvider = function (providerId) {
  this.serviceProviders = this.serviceProviders.filter((sp) => sp.provider.toString() !== providerId.toString())
  this.updateStats()
}

// Method to update zone statistics
pickupZoneSchema.methods.updateStats = function () {
  this.stats.totalProviders = this.serviceProviders.length
  this.stats.totalServices = this.serviceProviders.reduce((total, sp) => total + sp.services.length, 0)
}

// Static method to find zones by coordinates
pickupZoneSchema.statics.findByCoordinates = function (latitude, longitude) {
  return this.find({
    boundaries: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
    },
    isActive: true,
  })
}

// Static method to find nearby zones
pickupZoneSchema.statics.findNearby = function (latitude, longitude, maxDistance = 10000) {
  return this.find({
    center: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance, // meters
      },
    },
    isActive: true,
  })
}

module.exports = mongoose.model("PickupZone", pickupZoneSchema)
