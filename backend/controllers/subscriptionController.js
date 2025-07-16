const Subscription = require('../models/Subscription');
const User = require('../models/User');

const PLANS = {
  Free: { maxBookings: 10, visibility: 'regular', analytics: false },
  Standard: { maxBookings: 50, visibility: 'boosted', analytics: 'basic' },
  Premium: { maxBookings: Infinity, visibility: 'top', analytics: 'advanced' }
};

// Subscribe to a plan
const subscribe = async (req, res) => {
  try {
    if (req.user.role !== 'service_provider') {
      return res.status(403).json({ success: false, message: 'Only service providers can subscribe' });
    }

    const { plan } = req.body;
    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 30); // 30-day subscription

    const existing = await Subscription.findOne({ user: req.user._id });
    if (existing) {
      existing.plan = plan;
      existing.startDate = startDate;
      existing.endDate = endDate;
      existing.isActive = true;
      await existing.save();
    } else {
      await Subscription.create({
        user: req.user._id,
        plan,
        startDate,
        endDate
      });
    }

    // Update user plan info
    await User.findByIdAndUpdate(req.user._id, {
      'serviceProvider.subscription': {
        plan,
        startDate,
        endDate
      }
    });

    res.json({ success: true, message: `Subscribed to ${plan} plan for 30 days.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to subscribe', error: error.message });
  }
};

// Get current plan
const getCurrentPlan = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No active subscription' });
    }
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load subscription', error: error.message });
  }
};

// Get available plans
const getAvailablePlans = (req, res) => {
  const plans = Object.entries(PLANS).map(([key, value]) => ({
    name: key,
    ...value
  }));
  res.json({ success: true, data: plans });
};

module.exports = {
  subscribe,
  getCurrentPlan,
  getAvailablePlans
};
