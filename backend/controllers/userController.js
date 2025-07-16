const User = require('../models/User');
const Booking = require('../models/Booking');
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
    
    const [bookings, services] = await Promise.all([
      Booking.countDocuments({
        $or: [{ customer: userId }, { serviceProvider: userId }]
      }),
      req.user.role === 'service_provider' ? 
        Service.countDocuments({ provider: userId }) : 
        Promise.resolve(0)
    ]);

    const stats = {
      bookings,
      services,
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

    const searchQuery = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

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
    const type = req.query.type || 'points';
    const limit = parseInt(req.query.limit) || 10;

    let query = { role: 'service_provider' };
    let sort = {};

    if (type === 'rating') {
      sort = { 'serviceProvider.rating.average': -1 };
    } else {
      sort = { points: -1 };
    }

    const topUsers = await User.find(query)
      .sort(sort)
      .limit(limit)
      .select('username avatar points serviceProvider.rating');

    res.json({ 
      success: true, 
      data: topUsers 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get leaderboard', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Rate or update rating for a collector
const rateCollector = async (req, res) => {
  try {
    const { star, comment } = req.body;
    const collector = await User.findById(req.params.collectorId);

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

module.exports = {
  getUserById,
  updateUserProfile,
  uploadAvatar,
  getUserStats,
  searchUsers,
  getLeaderboard,
  rateCollector
};