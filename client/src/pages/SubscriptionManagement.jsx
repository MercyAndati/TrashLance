import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Crown, CreditCard, Check, AlertTriangle, TrendingUp, Users, Zap } from 'lucide-react';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.role === 'service_provider') {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscriptions/status');
      setSubscriptionData(response.data.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpgrade = async (planName) => {
    try {
      setUpdating(true);
      await api.put('/subscriptions/update', { plan: planName, months: 1 });
      await fetchSubscriptionStatus();
      // TODO: Add success notification
    } catch (error) {
      console.error('Error upgrading plan:', error);
      // TODO: Add error notification
    } finally {
      setUpdating(false);
    }
  };

  if (!user || user.role !== 'service_provider') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page is only available for service providers.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error Loading Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load subscription details. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const { currentPlan, originalPlan, planDetails, usage, subscription, availablePlans } = subscriptionData;
  const { currentCount, limit, remaining, percentage } = usage;
  const { isExpired, startDate, endDate, isActive } = subscription;

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'Premium':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'Standard':
        return <TrendingUp className="w-6 h-6 text-blue-500" />;
      default:
        return <CreditCard className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'Premium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Standard':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription plan and view usage statistics.
        </p>
      </div>

      {/* Current Plan Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Current Plan
          </h2>
          {isExpired && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full dark:bg-red-900/20 dark:text-red-200">
              Expired
            </span>
          )}
        </div>

        <div className={`border-2 rounded-lg p-6 ${getPlanColor(currentPlan)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getPlanIcon(currentPlan)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPlan} Plan
                </h3>
                {isExpired && originalPlan !== 'Free' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Downgraded from {originalPlan} (expired)
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {planDetails.price === 0 ? 'Free' : `Ksh ${planDetails.price.toLocaleString()}`}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">per month</p>
            </div>
          </div>

          {/* Usage Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Monthly Bookings</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {currentCount}/{limit === Infinity ? '∞' : limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className={`h-2 rounded-full ${
                  percentage > 80 ? 'bg-red-500' : 
                  percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-gray-500 dark:text-gray-400">
                {remaining > 0 ? `${remaining} remaining` : 'Limit reached'}
              </span>
              <span className="text-gray-500 dark:text-gray-400">{percentage}% used</span>
            </div>
          </div>

          {/* Plan Features */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Plan Features:</h4>
            <ul className="space-y-2">
              {planDetails.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Subscription Dates */}
          {isActive && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">End Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Available Plans
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => (
            <div
              key={plan.name}
              className={`border-2 rounded-lg p-6 transition-all ${
                plan.name === currentPlan
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getPlanIcon(plan.name)}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                </div>
                {plan.name === currentPlan && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900/20 dark:text-green-200">
                    Current
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price === 0 ? 'Free' : `Ksh ${plan.price.toLocaleString()}`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">per month</p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {plan.monthlyBookings === Infinity ? 'Unlimited' : `${plan.monthlyBookings}`} bookings per month
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {plan.name !== currentPlan && (
                <button
                  onClick={() => handlePlanUpgrade(plan.name)}
                  disabled={updating}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {updating ? 'Updating...' : plan.name === 'Free' ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Warning for expired subscriptions */}
      {isExpired && (
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Subscription Expired
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Your subscription has expired. You are now on the Free plan with limited features. 
                Renew your subscription to access premium features and higher booking limits.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement; 