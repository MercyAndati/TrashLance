// controllers/adminController.js
const User = require('../models/User');
const Booking = require('../models/Booking');

// Get all users (basic pagination and filtering)
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search, status } = req.query;
    console.log('Admin getAllUsers called with:', { role, page, limit, search, status });
    
    let query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Query:', query);

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    console.log(`Found ${users.length} users out of ${total} total`);

    res.json({
      success: true,
      data: {
        users,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
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

// Get admin dashboard stats
const getAdminStats = async (req, res) => {
  try {
    const Post = require('../models/Post');
    
    // Get real data from database
    const [
      totalUsers,
      totalBookings,
      activeBookings,
      completedBookings,
      totalRevenue,
      totalReports,
      pendingReports,
      verifiedProviders,
      pendingProviders,
      customerUsers,
      serviceProviderUsers,
      governmentUsers
    ] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['pending', 'confirmed', 'in_progress'] } }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      Post.countDocuments(),
      Post.countDocuments({ status: 'reported' }),
      User.countDocuments({ role: 'service_provider', 'serviceProvider.isVerified': true }),
      User.countDocuments({ role: 'service_provider', 'serviceProvider.isVerified': false }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'service_provider' }),
      User.countDocuments({ role: 'government' })
    ]);

    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyRevenue = await Booking.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]).then(result => result[0]?.total || 0);

    // Calculate growth percentages (mock for now, can be enhanced later)
    const stats = {
      totalUsers,
      totalBookings,
      activeBookings,
      completedBookings,
      totalRevenue: totalRevenue.toFixed(2),
      monthlyRevenue: monthlyRevenue.toFixed(2),
      totalReports,
      pendingReports,
      verifiedProviders,
      pendingProviders,
      customerUsers,
      serviceProviderUsers,
      governmentUsers,
      // Growth percentages (mock data for now)
      userGrowth: '+12%',
      bookingGrowth: '+8%',
      revenueGrowth: '+22%',
      reportGrowth: '+15%'
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get recent activity for admin dashboard
const getRecentActivity = async (req, res) => {
  try {
    const Post = require('../models/Post');
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email role createdAt');

    const recentBookings = await Booking.find()
      .populate('customer', 'username')
      .populate('serviceProvider', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('bookingNumber status pricing.totalAmount createdAt customer serviceProvider');

    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt author');

    const activity = [
      ...recentUsers.map(user => ({
        type: 'user_registered',
        description: `New ${user.role} registered: ${user.username}`,
        timestamp: user.createdAt,
        user: user.username,
        role: user.role
      })),
      ...recentBookings.map(booking => ({
        type: 'booking_created',
        description: `New booking #${booking.bookingNumber} by ${booking.customer?.username || 'Unknown'}`,
        timestamp: booking.createdAt,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        amount: booking.pricing?.totalAmount || 0
      })),
      ...recentPosts.map(post => ({
        type: 'report_submitted',
        description: `New report: ${post.title}`,
        timestamp: post.createdAt,
        title: post.title,
        status: post.status
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get admin analytics with real-time data
const getAdminAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    const Post = require('../models/Post');
    
    // Get current date and calculate date ranges
    const now = new Date();
    let startDate, endDate;
    
    if (timeframe === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (timeframe === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else { // year
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      endDate = now;
    }

    // Get subscription revenue data
    const subscriptionData = await calculateSubscriptionRevenue();
    
    // Get platform performance data
    const platformData = await calculatePlatformPerformance(startDate, endDate);

    // Get real-time statistics
    const [
      totalUsers,
      newUsers,
      totalBookings,
      newBookings,
      totalRevenue,
      newRevenue,
      totalReports,
      newReports,
      verifiedProviders,
      pendingProviders,
      customerUsers,
      serviceProviderUsers,
      governmentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      Booking.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          } 
        },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      Post.countDocuments(),
      Post.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      User.countDocuments({ role: 'service_provider', 'serviceProvider.isVerified': true }),
      User.countDocuments({ role: 'service_provider', 'serviceProvider.isVerified': false }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'service_provider' }),
      User.countDocuments({ role: 'government' })
    ]);

    // Calculate growth percentages
    const userGrowth = totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : 0;
    const bookingGrowth = totalBookings > 0 ? ((newBookings / totalBookings) * 100).toFixed(1) : 0;
    const revenueGrowth = totalRevenue > 0 ? ((newRevenue / totalRevenue) * 100).toFixed(1) : 0;
    const reportGrowth = totalReports > 0 ? ((newReports / totalReports) * 100).toFixed(1) : 0;

    // Generate time series data for charts
    const timeSeriesData = await generateTimeSeriesData(timeframe, startDate, endDate);

    const analytics = {
      stats: {
        totalUsers,
        newUsers,
        totalBookings,
        newBookings,
        totalRevenue: totalRevenue.toFixed(2),
        newRevenue: newRevenue.toFixed(2),
        totalReports,
        newReports,
        verifiedProviders,
        pendingProviders,
        customerUsers,
        serviceProviderUsers,
        governmentUsers
      },
      growth: {
        users: userGrowth,
        bookings: bookingGrowth,
        revenue: revenueGrowth,
        reports: reportGrowth
      },
      timeSeries: timeSeriesData,
      subscriptionRevenue: subscriptionData,
      platformPerformance: platformData
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to generate time series data
const generateTimeSeriesData = async (timeframe, startDate, endDate) => {
  const Post = require('../models/Post');
  const data = [];
  
  if (timeframe === 'week') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const [users, bookings, revenue, reports] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Booking.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Booking.aggregate([
          { 
            $match: { 
              status: 'completed',
              createdAt: { $gte: dayStart, $lte: dayEnd }
            } 
          },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]).then(result => result[0]?.total || 0),
        Post.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } })
      ]);
      
      data.push({
        date: date.toISOString().split('T')[0],
        users,
        bookings,
        revenue: revenue.toFixed(2),
        reports
      });
    }
  } else if (timeframe === 'month') {
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const [users, bookings, revenue, reports] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Booking.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Booking.aggregate([
          { 
            $match: { 
              status: 'completed',
              createdAt: { $gte: dayStart, $lte: dayEnd }
            } 
          },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]).then(result => result[0]?.total || 0),
        Post.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } })
      ]);
      
      data.push({
        date: date.toISOString().split('T')[0],
        users,
        bookings,
        revenue: revenue.toFixed(2),
        reports
      });
    }
  } else { // year
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const [users, bookings, revenue, reports] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
        Booking.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
        Booking.aggregate([
          { 
            $match: { 
              status: 'completed',
              createdAt: { $gte: monthStart, $lte: monthEnd }
            } 
          },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]).then(result => result[0]?.total || 0),
        Post.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } })
      ]);
      
      data.push({
        date: date.toISOString().slice(0, 7),
        users,
        bookings,
        revenue: revenue.toFixed(2),
        reports
      });
    }
  }
  
  return data;
};

// Calculate subscription revenue
const calculateSubscriptionRevenue = async () => {
  try {
    // Get subscription counts
    const [premiumUsers, standardUsers, freeUsers] = await Promise.all([
      User.countDocuments({ 
        role: 'service_provider', 
        'serviceProvider.subscription.plan': 'Premium' 
      }),
      User.countDocuments({ 
        role: 'service_provider', 
        'serviceProvider.subscription.plan': 'Standard' 
      }),
      User.countDocuments({ 
        role: 'service_provider', 
        $or: [
          { 'serviceProvider.subscription.plan': 'Free' },
          { 'serviceProvider.subscription.plan': { $exists: false } }
        ]
      })
    ]);

    // Calculate revenue (in KSh)
    const premiumRevenue = premiumUsers * 1000; 
    const standardRevenue = standardUsers * 500;
    const freeRevenue = freeUsers * 0; // Free plan

    const monthlyRevenue = premiumRevenue + standardRevenue + freeRevenue;
    const annualRevenue = monthlyRevenue * 12;

    // Calculate growth (compare with previous month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [lastMonthPremium, lastMonthStandard] = await Promise.all([
      User.countDocuments({ 
        role: 'service_provider', 
        'serviceProvider.subscription.plan': 'Premium',
        'serviceProvider.subscription.startDate': { $lte: lastMonth }
      }),
      User.countDocuments({ 
        role: 'service_provider', 
        'serviceProvider.subscription.plan': 'Standard',
        'serviceProvider.subscription.startDate': { $lte: lastMonth }
      })
    ]);

    const lastMonthRevenue = (lastMonthPremium * 1000) + (lastMonthStandard * 500);
    const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;

    return {
      monthlyRevenue,
      annualRevenue,
      premiumUsers,
      standardUsers,
      freeUsers,
      premiumRevenue,
      standardRevenue,
      freeRevenue,
      revenueGrowth: parseFloat(revenueGrowth),
      subscriptionBreakdown: {
        premium: { users: premiumUsers, revenue: premiumRevenue },
        standard: { users: standardUsers, revenue: standardRevenue },
        free: { users: freeUsers, revenue: freeRevenue }
      }
    };
  } catch (error) {
    console.error('Error calculating subscription revenue:', error);
    return {
      monthlyRevenue: 0,
      annualRevenue: 0,
      premiumUsers: 0,
      standardUsers: 0,
      freeUsers: 0,
      premiumRevenue: 0,
      standardRevenue: 0,
      freeRevenue: 0,
      revenueGrowth: 0,
      subscriptionBreakdown: {
        premium: { users: 0, revenue: 0 },
        standard: { users: 0, revenue: 0 },
        free: { users: 0, revenue: 0 }
      }
    };
  }
};

// Calculate platform performance
const calculatePlatformPerformance = async (startDate, endDate) => {
  try {
    const Booking = require('../models/Booking');
    
    // Get total provider earnings
    const totalEarnings = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]).then(result => result[0]?.total || 0);

    // Get earnings for the selected timeframe
    const timeframeEarnings = await Booking.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]).then(result => result[0]?.total || 0);

    // Get active providers
    const activeProviders = await User.countDocuments({ 
      role: 'service_provider', 
      'serviceProvider.isVerified': true 
    });

    // Get top earners
    const topEarners = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { 
        _id: '$serviceProvider', 
        totalEarnings: { $sum: '$pricing.totalAmount' },
        bookingCount: { $sum: 1 }
      }},
      { $sort: { totalEarnings: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'provider'
      }},
      { $unwind: '$provider' },
      { $project: {
        providerName: '$provider.username',
        totalEarnings: 1,
        bookingCount: 1
      }}
    ]);

    // Calculate growth
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthEarnings = await Booking.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { 
            $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            $lt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)
          }
        } 
      },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]).then(result => result[0]?.total || 0);

    const platformGrowth = lastMonthEarnings > 0 ? ((timeframeEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1) : 0;

    return {
      totalEarnings,
      timeframeEarnings,
      activeProviders,
      topEarners,
      platformGrowth: parseFloat(platformGrowth)
    };
  } catch (error) {
    console.error('Error calculating platform performance:', error);
    return {
      totalEarnings: 0,
      timeframeEarnings: 0,
      activeProviders: 0,
      topEarners: [],
      platformGrowth: 0
    };
  }
};

// Export analytics data
const exportAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month', format = 'json' } = req.query;
    
    // Get analytics data
    const analytics = await getAdminAnalyticsData(timeframe);
    
    if (format === 'csv') {
      // Generate CSV
      const csvData = generateCSV(analytics);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(analytics);
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to get analytics data
const getAdminAnalyticsData = async (timeframe) => {
  const Post = require('../models/Post');
  
  const now = new Date();
  let startDate, endDate;
  
  if (timeframe === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else if (timeframe === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else {
    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    endDate = now;
  }

  const subscriptionData = await calculateSubscriptionRevenue();
  const platformData = await calculatePlatformPerformance(startDate, endDate);
  const timeSeriesData = await generateTimeSeriesData(timeframe, startDate, endDate);

  return {
    timeframe,
    exportDate: new Date().toISOString(),
    subscriptionRevenue: subscriptionData,
    platformPerformance: platformData,
    timeSeriesData
  };
};

// Generate CSV data
const generateCSV = (analytics) => {
  const { subscriptionRevenue, platformPerformance } = analytics;
  
  let csv = 'Metric,Value\n';
  csv += `Monthly Revenue,KSh ${subscriptionRevenue.monthlyRevenue}\n`;
  csv += `Annual Revenue,KSh ${subscriptionRevenue.annualRevenue}\n`;
  csv += `Premium Users,${subscriptionRevenue.premiumUsers}\n`;
  csv += `Standard Users,${subscriptionRevenue.standardUsers}\n`;
  csv += `Free Users,${subscriptionRevenue.freeUsers}\n`;
  csv += `Premium Revenue,KSh ${subscriptionRevenue.premiumRevenue}\n`;
  csv += `Standard Revenue,KSh ${subscriptionRevenue.standardRevenue}\n`;
  csv += `Revenue Growth,${subscriptionRevenue.revenueGrowth}%\n`;
  csv += `Total Provider Earnings,KSh ${platformPerformance.totalEarnings}\n`;
  csv += `Active Providers,${platformPerformance.activeProviders}\n`;
  csv += `Platform Growth,${platformPerformance.platformGrowth}%\n`;
  
  return csv;
};

module.exports = {
  getAllUsers,
  verifyCollector,
  deleteUserByAdmin,
  createGovernmentAccount,
  getAdminStats,
  getRecentActivity,
  getAdminAnalytics,
  exportAnalytics
};
