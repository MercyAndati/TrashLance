import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Trash2, Edit, Plus, Package, Clock, DollarSign } from 'lucide-react';

const MyServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'service_provider') {
      fetchMyServices();
    }
  }, [user]);

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services/my-services');
      setServices(response.data.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await api.delete(`/services/${serviceId}`);
        await fetchMyServices(); // Refresh the list
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service');
      }
    }
  };

  const getServiceIcon = (category) => {
    switch (category) {
      case 'residential_pickup':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'commercial_pickup':
        return <Package className="w-5 h-5 text-green-500" />;
      case 'recycling':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'hazardous_waste':
        return <Package className="w-5 h-5 text-red-500" />;
      case 'construction_debris':
        return <Package className="w-5 h-5 text-gray-500" />;
      case 'bulk_items':
        return <Package className="w-5 h-5 text-purple-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Services
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage the services you currently offer to customers.
        </p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Services Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't added any services yet. Add services to start receiving bookings.
          </p>
          <button
            onClick={() => window.location.href = '/services/add'}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getServiceIcon(service.category)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {service.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.location.href = `/services/${service._id}/edit`}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Edit service"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {service.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Price:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    KSh {service.pricing.basePrice} per {service.pricing.unit}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {service.duration.estimated} minutes
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    service.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                  }`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {service.pricing.additionalFees && service.pricing.additionalFees.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Additional Fees:
                  </h4>
                  <div className="space-y-1">
                    {service.pricing.additionalFees.map((fee, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{fee.name}:</span>
                        <span className="text-gray-900 dark:text-white">
                          KSh {fee.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => window.location.href = '/services/add'}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Service
        </button>
      </div>
    </div>
  );
};

export default MyServices; 