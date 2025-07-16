const Service = require("../models/Service")
const User = require("../models/User")

// Get all services
const getAllServices = async (req, res) => {
  try {
    const {
      category,
      location,
      priceRange,
      rating,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    const query = { isActive: true }

    // Apply filters
    if (category) query.category = category
    if (rating) query["rating.average"] = { $gte: Number.parseFloat(rating) }
    if (priceRange) {
      const [min, max] = priceRange.split("-")
      query["pricing.basePrice"] = {
        $gte: Number.parseFloat(min),
        $lte: Number.parseFloat(max),
      }
    }

    const options = {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
      populate: {
        path: "provider",
        select: "username avatar serviceProvider.rating serviceProvider.companyName",
      },
    }

    // Use regular find instead of paginate to avoid circular reference
    const services = await Service.find(query)
      .populate("provider", "username avatar serviceProvider.rating serviceProvider.companyName")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Service.countDocuments(query)

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Services error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get service by ID
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      "provider",
      "username avatar serviceProvider.rating serviceProvider.companyName serviceProvider.workingHours",
    )

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    res.json({
      success: true,
      data: { service },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Create service
const createService = async (req, res) => {
  try {
    const service = new Service({
      ...req.body,
      provider: req.user._id,
    })

    await service.save()

    // Populate provider info for response
    await service.populate("provider", "username avatar serviceProvider.companyName")

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: { service },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Update service
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    // Check if user owns this service
    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    Object.assign(service, req.body)
    await service.save()

    await service.populate("provider", "username avatar serviceProvider.companyName")

    res.json({
      success: true,
      message: "Service updated successfully",
      data: { service },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Delete service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    // Check if user owns this service
    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    await Service.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Service deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get services by provider
const getServicesByProvider = async (req, res) => {
  try {
    const services = await Service.find({
      provider: req.params.providerId,
      isActive: true,
    }).populate("provider", "username avatar serviceProvider.rating serviceProvider.companyName")

    res.json({
      success: true,
      data: { services },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get provider services",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByProvider,
}
