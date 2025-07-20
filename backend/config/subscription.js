const subscriptionPlans = {
  Free: {
    name: "Free",
    monthlyBookings: 10,
    features: [
      "Basic booking management",
      "Standard support",
      "Basic analytics"
    ],
    price: 0,
    currency: "Ksh"
  },
  Standard: {
    name: "Standard", 
    monthlyBookings: 50,
    features: [
      "Enhanced booking management",
      "Priority support",
      "Advanced analytics",
      "Custom branding"
    ],
    price: 500,
    currency: "Ksh"
  },
  Premium: {
    name: "Premium",
    monthlyBookings: Infinity,
    features: [
      "Unlimited bookings",
      "24/7 priority support", 
      "Advanced analytics & reporting",
      "Custom branding",
      "API access",
      "Dedicated account manager"
    ],
    price: 1000,
    currency: "Ksh"
  }
};

// Helper function to get plan limits
const getPlanLimit = (planName) => {
  return subscriptionPlans[planName]?.monthlyBookings || subscriptionPlans.Free.monthlyBookings;
};

// Helper function to get plan details
const getPlanDetails = (planName) => {
  return subscriptionPlans[planName] || subscriptionPlans.Free;
};

// Helper function to check if subscription is expired
const isSubscriptionExpired = (endDate) => {
  return new Date() > new Date(endDate);
};

// Helper function to get effective plan (Free if expired)
const getEffectivePlan = (user) => {
  if (!user.serviceProvider?.subscription) {
    return 'Free';
  }
  
  const { plan, endDate } = user.serviceProvider.subscription;
  
  if (isSubscriptionExpired(endDate)) {
    return 'Free';
  }
  
  return plan;
};

module.exports = {
  subscriptionPlans,
  getPlanLimit,
  getPlanDetails,
  isSubscriptionExpired,
  getEffectivePlan
}; 