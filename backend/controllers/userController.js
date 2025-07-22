const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const { calculateDistance } = require('../utils/location');

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken')
      .populate('serviceProvider.servicesOffered', 'name category');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Update user profile (alias for updateUserProfile)
const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully', 
      data: user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Upload user avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    ).select('-password -refreshToken');

    res.json({ 
      success: true, 
      message: 'Avatar uploaded successfully', 
      data: { avatar: user.avatar } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload avatar', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [bookings, services, completedBookings, upcomingBookings, totalEarnings, monthlyEarnings] = await Promise.all([
      Booking.countDocuments({
        $or: [{ customer: userId }, { serviceProvider: userId }]
      }),
      req.user.role === 'service_provider' ? 
        Service.countDocuments({ provider: userId }) : 
        Promise.resolve(0),
      req.user.role === 'service_provider' ?
        Booking.countDocuments({ serviceProvider: userId, status: 'completed' }) :
        Promise.resolve(0),
      req.user.role === 'service_provider' ?
        Booking.countDocuments({ serviceProvider: userId, status: { $in: ['pending', 'confirmed'] } }) :
        Promise.resolve(0),
      req.user.role === 'service_provider' ?
        Booking.aggregate([
          { $match: { serviceProvider: userId, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]).then(result => result[0]?.total || 0) :
        Promise.resolve(0),
      req.user.role === 'service_provider' ?
        Booking.aggregate([
          { 
            $match: { 
              serviceProvider: userId, 
              status: 'completed',
              createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            } 
          },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]).then(result => result[0]?.total || 0) :
        Promise.resolve(0)
    ]);

    const stats = {
      bookings,
      services,
      completedBookings,
      upcomingBookings,
      totalEarnings,
      monthlyEarnings,
      rating: req.user.serviceProvider?.rating?.average || 0,
      points: req.user.points || 0
    };

    res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user stats', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { query, role } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const searchQuery = {};
    if (query) {
      searchQuery.$or = [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }
    if (role) {
      searchQuery.role = role;
    }

    const users = await User.find(searchQuery)
      .select('-password -refreshToken')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search users', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get leaderboard by points
const getLeaderboard = async (req, res) => {
  try {
    const category = req.query.category || 'points';
    const timeframe = req.query.timeframe || 'all';
    let query = {};
    let sort = {};

    // Filter by role if provided
    if (req.query.role && req.query.role !== 'all') {
      query.role = req.query.role;
    }

    // Only filter by role for service_provider-specific categories
    if (category === 'earnings' || category === 'rating') {
      query.role = 'service_provider';
    }

    // Sorting logic
    if (category === 'rating') {
      sort = { 'serviceProvider.rating.average': -1 };
    } else if (category === 'earnings') {
      sort = { earnings: -1 };
    } else if (category === 'reports') {
      sort = { reports: -1 };
    } else if (category === 'bookings') {
      sort = { bookings: -1 };
    } else {
      sort = { points: -1 };
    }
    // Fetch leaderboard
    const leaderboard = await User.find(query)
      .sort(sort)
      .limit(50)
      .select('username avatar points role serviceProvider.rating earnings reports bookings');

    // Find current user's rank
    let userRank = null;
    if (req.user) {
      const allUsers = await User.find(query).sort(sort).select('_id points role earnings reports bookings');
      const index = allUsers.findIndex(u => u._id.toString() === req.user._id.toString());
      if (index !== -1) {
        userRank = {
          position: index + 1,
          points: allUsers[index].points,
          role: allUsers[index].role,
          earnings: allUsers[index].earnings,
          reports: allUsers[index].reports,
          bookings: allUsers[index].bookings,
        };
      }
    }

    res.json({
      success: true,
      data: {
        leaderboard,
        userRank,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Complete onboarding for service providers
const completeOnboarding = async (req, res) => {
  try {
    console.log("=== ONBOARDING DEBUG ===");
    console.log("Request headers:", req.headers);
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Received onboarding data:", req.body);
    console.log("Company name from body:", req.body.companyName);
    console.log("Subscription from body:", req.body.subscription);
    
    // Use req.body directly since we're now sending JSON
    const {
      companyName,
      businessLicense,
      servicesOffered,
      workingHours,
      serviceRadius,
      serviceLocations,
      subscription,
      pricing
    } = req.body;

    // Validate required fields
    console.log("Validation check:", { companyName, servicesOffered, pricing });
    console.log("Subscription mapping:", { 
      subscription, 
      mappedPlan: subscription === 'freemium' ? 'Free' : subscription === 'standard' ? 'Standard' : subscription === 'premium' ? 'Premium' : 'Free' 
    });
    
    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: company name'
      });
    }
    
    if (!servicesOffered) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: services offered'
      });
    }
    
    if (!pricing) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: pricing'
      });
    }

    // Update user with service provider information
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        role: 'service_provider',
        'serviceProvider.companyName': companyName,
        'serviceProvider.businessLicense': businessLicense || '',
        'serviceProvider.basePrice': parseFloat(pricing.basePrice) || 0,
        'serviceProvider.servicesOffered': [], // Will be populated by services created below
        'serviceProvider.workingHours': workingHours,
        'serviceProvider.serviceRadius': serviceRadius || 10,
        'serviceProvider.serviceLocations': serviceLocations || '',
        'serviceProvider.subscription': {
          plan: subscription === 'freemium' ? 'Free' : subscription === 'standard' ? 'Standard' : subscription === 'premium' ? 'Premium' : 'Free',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        'serviceProvider.isVerified': false, // Will be verified by admin
        'serviceProvider.documents': [] // Initialize as empty array, will be handled separately
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create services for the provider based on selected service types
    if (servicesOffered && servicesOffered.length > 0) {
      const serviceTypes = {
        residential_pickup: { name: 'Residential Pickup', description: 'Regular household waste collection', category: 'residential_pickup' },
        commercial_pickup: { name: 'Commercial Pickup', description: 'Business waste collection', category: 'commercial_pickup' },
        bulk_removal: { name: 'Bulk Item Removal', description: 'Large item disposal service', category: 'bulk_items' },
        recycling: { name: 'Recycling Services', description: 'Specialized recycling collection', category: 'recycling' },
        hazardous_waste: { name: 'Hazardous Waste', description: 'Safe disposal of hazardous materials', category: 'hazardous_waste' },
        construction_debris: { name: 'Construction Debris', description: 'Construction and demolition waste', category: 'construction_debris' }
      };

              const servicePromises = servicesOffered.map(serviceType => {
          const serviceInfo = serviceTypes[serviceType];
          return Service.create({
            provider: req.user._id,
            name: serviceInfo.name,
            description: serviceInfo.description,
            category: serviceInfo.category,
            pricing: {
              type: pricing.type,
              basePrice: parseFloat(pricing.basePrice),
              unit: pricing.unit,
              currency: pricing.currency || 'Ksh',
              additionalFees: pricing.additionalFee ? [{
                name: 'Additional Fee',
                amount: parseFloat(pricing.additionalFee),
                description: pricing.additionalFeeReason || 'Additional service fee'
              }] : []
            },
            duration: {
              estimated: 60, // Default 1 hour
              minimum: 30,
              maximum: 120
            },
            isActive: true
          });
        });

      const createdServices = await Promise.all(servicePromises);
      
      // Update user with service references
      await User.findByIdAndUpdate(req.user._id, {
        'serviceProvider.servicesOffered': createdServices.map(service => service._id)
      });
    }

    // Send notification to admin for verification (optional - can be implemented later)
    try {
      // Find an admin user to send notification to
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        await Notification.createAndSend({
          recipient: adminUser._id,
          type: 'new_service_provider',
          title: 'New Service Provider Registration',
          message: `${updatedUser.username} has completed onboarding and requires verification.`,
          category: 'verification',
          data: {
            userId: updatedUser._id,
            actionUrl: `/admin/users/${updatedUser._id}`
          }
        });
      }
    } catch (notificationError) {
      console.log('Notification sending failed (non-critical):', notificationError.message);
    }

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Rate or update rating for a collector
const rateCollector = async (req, res) => {
  try {
    const { star, comment } = req.body;
    const collector = await User.findById(req.params.id);

    if (!collector || collector.role !== 'service_provider') {
      return res.status(404).json({ 
        success: false, 
        message: 'Collector not found' 
      });
    }

    const pointsMap = { 1: 0, 2: 5, 3: 10, 4: 15, 5: 20 };

    // Check if user has already rated this collector
    const existingIndex = collector.ratings.findIndex(
      r => r.citizenId.toString() === req.user._id.toString()
    );

    if (existingIndex !== -1) {
      // Update existing rating
      const oldStar = collector.ratings[existingIndex].star;
      collector.ratings[existingIndex].star = star;
      collector.ratings[existingIndex].comment = comment;
      collector.ratings[existingIndex].ratedAt = new Date();

      // Update points (remove old, add new)
      collector.points -= pointsMap[oldStar] || 0;
      collector.points += pointsMap[star] || 0;
    } else {
      // Add new rating
      collector.ratings.push({
        star,
        comment,
        citizenId: req.user._id
      });
      collector.points += pointsMap[star] || 0;
    }

    // Recalculate rating average and count
    const totalRatings = collector.ratings.length;
    const average = collector.ratings.reduce((sum, r) => sum + r.star, 0) / totalRatings;
    collector.serviceProvider.rating.average = Math.round(average * 10) / 10;
    collector.serviceProvider.rating.count = totalRatings;

    await collector.save();

    // Send comment notification if there's a comment
    if (comment && comment.trim()) {
      await Notification.createAndSend({
        recipient: collector._id,
        sender: req.user._id,
        type: 'comment_received',
        title: 'New Comment on Your Profile',
        message: `${req.user.username} left a comment on your profile.`,
        category: 'account',
        data: {
          actionUrl: `/profile/${collector._id}`
        }
      });
    }

    res.json({
      success: true,
      message: existingIndex !== -1 ? 'Rating updated successfully' : 'Rating submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit rating', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get all unique locations from service providers
const getLocations = async (req, res) => {
  try {
    const locations = await User.distinct('serviceProvider.serviceLocations', {
      role: 'service_provider',
      'serviceProvider.serviceLocations': { $exists: true, $ne: '' }
    });

    // Filter out empty locations and split comma-separated locations
    const allLocations = [];
    locations.forEach(locationString => {
      if (locationString) {
        const locationArray = locationString.split(',').map(loc => loc.trim());
        allLocations.push(...locationArray);
      }
    });

    // Remove duplicates and empty strings
    const uniqueLocations = [...new Set(allLocations)].filter(loc => loc.length > 0);

    res.json({
      success: true,
      data: uniqueLocations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get collectors by location
const getCollectorsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    const decodedLocation = decodeURIComponent(location);

    const collectors = await User.find({
      role: 'service_provider',
      'serviceProvider.serviceLocations': { $regex: decodedLocation, $options: 'i' }
    })
    .select('username avatar serviceProvider.companyName serviceProvider.rating serviceProvider.serviceLocations serviceProvider.serviceRadius serviceProvider.servicesOffered')
    .populate('serviceProvider.servicesOffered', 'name category')
    .sort({ 'serviceProvider.rating.average': -1 });

    res.json({
      success: true,
      data: collectors
    });
  } catch (error) {
    console.error('Error fetching collectors by location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collectors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getUserServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.params.id, isActive: true });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

// Delete own account and related data
const deleteOwnAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    // Delete related data (optional, but recommended)
    await Promise.all([
      Booking.deleteMany({ $or: [{ customer: userId }, { serviceProvider: userId }] }),
      Service.deleteMany({ provider: userId }),
      Notification.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId)
    ]);
    res.json({ success: true, message: "Account and related data deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete account.", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  getUserById,
  updateUserProfile,
  uploadAvatar,
  getUserStats,
  searchUsers,
  getLeaderboard,
  rateCollector,
  completeOnboarding,
  getLocations,
  getCollectorsByLocation,
  getUserServices,
  deleteOwnAccount,
};