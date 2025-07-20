const User = require('../models/User');
const Booking = require('../models/Booking');
const { getPlanLimit, getEffectivePlan, isSubscriptionExpired, getPlanDetails, subscriptionPlans } = require('../config/subscription');

// Get current subscription status for service provider
const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.role !== 'service_provider') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only for service providers'
      });
    }

    const effectivePlan = getEffectivePlan(user);
    const planDetails = getPlanDetails(effectivePlan);
    const planLimit = getPlanLimit(effectivePlan);
    
    // Get current month's booking count
    const now = new Date();
    const monthlyBookingCount = await Booking.countDocuments({
      serviceProvider: user._id,
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }
    });

    const remainingBookings = planLimit - monthlyBookingCount;
    const isExpired = user.serviceProvider?.subscription?.endDate ? 
      isSubscriptionExpired(user.serviceProvider.subscription.endDate) : false;

    res.json({
      success: true,
      data: {
        currentPlan: effectivePlan,
        originalPlan: user.serviceProvider?.subscription?.plan || 'Free',
        planDetails,
        usage: {
          currentCount: monthlyBookingCount,
          limit: planLimit,
          remaining: remainingBookings,
          percentage: planLimit === Infinity ? 0 : Math.round((monthlyBookingCount / planLimit) * 100)
        },
        subscription: {
          isExpired,
          startDate: user.serviceProvider?.subscription?.startDate,
          endDate: user.serviceProvider?.subscription?.endDate,
          isActive: !isExpired && user.serviceProvider?.subscription?.endDate
        },
        availablePlans: Object.keys(subscriptionPlans).map(planName => ({
          name: planName,
          ...subscriptionPlans[planName]
        }))
      }
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update subscription plan (for admin or self-upgrade)
const updateSubscription = async (req, res) => {
  try {
    const { plan, months = 1 } = req.body;
    
    if (!['Free', 'Standard', 'Premium'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be Free, Standard, or Premium'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (user.role !== 'service_provider') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only for service providers'
      });
    }

    // Calculate new end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    // Update subscription
    user.serviceProvider = user.serviceProvider || {};
    user.serviceProvider.subscription = {
      plan,
      startDate,
      endDate
    };

    await user.save();

    res.json({
      success: true,
      message: `Subscription updated to ${plan} plan`,
      data: {
        plan,
        startDate,
        endDate,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Public: Get available subscription plans and features
const getAvailablePlans = (req, res) => {
  try {
    const plans = Object.keys(subscriptionPlans).map(planName => ({
      name: planName,
      ...subscriptionPlans[planName]
    }));
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get plans', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  getSubscriptionStatus,
  updateSubscription,
  getAvailablePlans
};
