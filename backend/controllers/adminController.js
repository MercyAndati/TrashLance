// controllers/adminController.js
const User = require('../models/User');
const Booking = require('../models/Booking');

// Get all users (basic pagination and filtering)
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify or reject a collector
const verifyCollector = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'service_provider') {
      return res.status(404).json({ success: false, message: 'Collector not found' });
    }

    user.serviceProvider.isVerified = req.body.verify;
    await user.save();

    res.json({
      success: true,
      message: `Collector ${req.body.verify ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update collector status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin deletes a user
const deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Create a government account
const createGovernmentAccount = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // Check if email or phone already exists
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.email === email
          ? 'Email already in use'
          : 'Phone number already in use'
      });
    }

    // Create the user
    const governmentUser = await User.create({
      username,
      email,
      password,
      phone,
      role: 'government',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    res.status(201).json({
      success: true,
      message: 'Government account created successfully',
      data: governmentUser.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create government account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllUsers,
  verifyCollector,
  deleteUserByAdmin,
  createGovernmentAccount
};
