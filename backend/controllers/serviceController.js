const Service = require('../models/Service');
const User = require('../models/User');

// Get services for the current service provider
const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new service
const createService = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      pricing,
      duration,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, category, and pricing are required'
      });
    }

    // Check if service provider already has this category
    const existingService = await Service.findOne({
      provider: req.user._id,
      category: category
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'You already have a service in this category'
      });
    }

    const service = new Service({
      provider: req.user._id,
      name,
      description,
      category,
      pricing,
      duration: duration || {
        estimated: 60,
        minimum: 30,
        maximum: 120
      },
      isActive
    });

    await service.save();

    // Update user's servicesOffered array
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { 'serviceProvider.servicesOffered': service._id }
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const service = await Service.findOne({
      _id: id,
      provider: req.user._id
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Remove fields that shouldn't be updated
    delete updates.provider;
    delete updates._id;

    const updatedService = await Service.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findOne({
      _id: id,
      provider: req.user._id
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await Service.findByIdAndDelete(id);

    // Remove service from user's servicesOffered array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { 'serviceProvider.servicesOffered': id }
    });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get service by ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate('provider', 'username email phone serviceProvider.companyName');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all services (for customers to browse)
const getAllServices = async (req, res) => {
  try {
    const { category, provider, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (provider) {
      query.provider = provider;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const services = await Service.find(query)
      .populate('provider', 'username serviceProvider.companyName serviceProvider.rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);

    res.json({
      success: true,
      data: {
        docs: services,
        totalDocs: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getMyServices,
  createService,
  updateService,
  deleteService,
  getServiceById,
  getAllServices
};
