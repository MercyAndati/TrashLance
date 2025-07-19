import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AlertTriangle, Crown, CreditCard, X } from 'lucide-react';

const SubscriptionBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

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

  if (!user || user.role !== 'service_provider' || !subscriptionData || !showBanner) {
    return null;
  }

  const { currentPlan, usage, subscription } = subscriptionData;
  const { currentCount, limit, remaining, percentage } = usage;
  const { isExpired } = subscription;

  // Don't show banner if everything is fine
  if (!isExpired && remaining > 2 && currentPlan !== 'Free') {
    return null;
  }

  const getBannerType = () => {
    if (isExpired) return 'error';
    if (remaining <= 2) return 'warning';
    if (currentPlan === 'Free') return 'info';
    return 'success';
  };

  const getBannerContent = () => {
    if (isExpired) {
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Subscription Expired',
        message: 'Your subscription has expired. You are now on the Free plan with limited bookings.',
        action: 'Renew Now'
      };
    }
    
    if (remaining <= 2) {
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Booking Limit Warning',
        message: `You have ${remaining} booking${remaining === 1 ? '' : 's'} remaining this month.`,
        action: 'Upgrade Plan'
      };
    }
    
    if (currentPlan === 'Free') {
      return {
        icon: <Crown className="w-5 h-5" />,
        title: 'Free Plan Active',
        message: `You're on the Free plan (${limit} bookings/month). Upgrade for more features.`,
        action: 'View Plans'
      };
    }
    
    return null;
  };

  const bannerType = getBannerType();
  const bannerContent = getBannerContent();

  if (!bannerContent) return null;

  const getBannerClasses = () => {
    switch (bannerType) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      default:
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
    }
  };

  const handleAction = () => {
    navigate('/subscription');
  };

  return (
    <div className={`border-l-4 p-4 mb-4 ${getBannerClasses()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {bannerContent.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">
              {bannerContent.title}
            </h3>
            <p className="mt-1 text-sm">
              {bannerContent.message}
            </p>
            {!isExpired && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Bookings: {currentCount}/{limit === Infinity ? '∞' : limit}</span>
                  <span>{percentage}% used</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                  <div 
                    className={`h-1.5 rounded-full ${
                      percentage > 80 ? 'bg-red-600' : 
                      percentage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
            <button
              onClick={handleAction}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CreditCard className="w-3 h-3 mr-1" />
              {bannerContent.action}
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionBanner; 