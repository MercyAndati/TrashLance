const PickupZone = require("../models/PickupZone")
const User = require("../models/User")
const Service = require("../models/Service")

// Get all pickup zones
const getAllZones = async (req, res) => {
  try {
    const { city, state, page = 1, limit = 20 } = req.query

    const query = { isActive: true }
    if (city) query.city = new RegExp(city, "i")
    if (state) query.state = new RegExp(state, "i")

    const zones = await PickupZone.find(query)
      .select("name description city state stats center")
      .sort({ "stats.totalProviders": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await PickupZone.countDocuments(query)

    res.json({
      success: true,
      data: {
        zones,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pickup zones",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Search zones by location
const searchZonesByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      })
    }

    const latitude = Number.parseFloat(lat)
    const longitude = Number.parseFloat(lng)
    const maxDistance = Number.parseFloat(radius) * 1000 // Convert km to meters

    const zones = await PickupZone.find({
      isActive: true,
    }).limit(10)

    res.json({
      success: true,
      data: {
        zones,
        searchLocation: { latitude, longitude },
        found: zones.length > 0,
        message: zones.length === 0 ? "No collectors found in your area" : `Found ${zones.length} zones`,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search zones",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get zone details with service providers
const getZoneDetails = async (req, res) => {
  try {
    const zone = await PickupZone.findById(req.params.id).populate([
      {
        path: "serviceProviders.provider",
        select: "username avatar serviceProvider points ratings",
      },
      {
        path: "serviceProviders.services",
        select: "name description category pricing duration",
      },
    ])

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Pickup zone not found",
      })
    }

    res.json({
      success: true,
      data: { zone },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get zone details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Add service provider to zone (for service providers)
const addProviderToZone = async (req, res) => {
  try {
    const { zoneId, serviceIds } = req.body

    // Verify user is a service provider
    if (req.user.role !== "service_provider") {
      return res.status(403).json({
        success: false,
        message: "Only service providers can add themselves to zones",
      })
    }

    const zone = await PickupZone.findById(zoneId)
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Pickup zone not found",
      })
    }

    // Verify services belong to the user
    const services = await Service.find({
      _id: { $in: serviceIds },
    })

    if (services.length !== serviceIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some services not found",
      })
    }

    zone.addServiceProvider(req.user._id, serviceIds)
    await zone.save()

    res.json({
      success: true,
      message: "Successfully added to pickup zone",
      data: { zone },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add provider to zone",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Remove service provider from zone
const removeProviderFromZone = async (req, res) => {
  try {
    const { zoneId } = req.params

    const zone = await PickupZone.findById(zoneId)
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Pickup zone not found",
      })
    }

    zone.removeServiceProvider(req.user._id)
    await zone.save()

    res.json({
      success: true,
      message: "Successfully removed from pickup zone",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove provider from zone",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Create new pickup zone (Admin only)
const createZone = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create pickup zones",
      })
    }

    const zone = new PickupZone(req.body)
    await zone.save()

    res.status(201).json({
      success: true,
      message: "Pickup zone created successfully",
      data: { zone },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create pickup zone",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

module.exports = {
  getAllZones,
  searchZonesByLocation,
  getZoneDetails,
  addProviderToZone,
  removeProviderFromZone,
  createZone,
}
