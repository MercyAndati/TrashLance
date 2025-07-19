import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Package, Check, Plus, Save } from 'lucide-react';

const AddServices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentServices, setCurrentServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const serviceTypes = [
    { 
      id: "residential_pickup", 
      name: "Residential Pickup", 
      description: "Regular household waste collection",
      icon: Package,
      color: "text-blue-500"
    },
    { 
      id: "commercial_pickup", 
      name: "Commercial Pickup", 
      description: "Business waste collection",
      icon: Package,
      color: "text-green-500"
    },
    { 
      id: "bulk_removal", 
      name: "Bulk Item Removal", 
      description: "Large item disposal service",
      icon: Package,
      color: "text-purple-500"
    },
    { 
      id: "recycling", 
      name: "Recycling Services", 
      description: "Specialized recycling collection",
      icon: Package,
      color: "text-yellow-500"
    },
    { 
      id: "hazardous_waste", 
      name: "Hazardous Waste", 
      description: "Safe disposal of hazardous materials",
      icon: Package,
      color: "text-red-500"
    },
    { 
      id: "construction_debris", 
      name: "Construction Debris", 
      description: "Construction and demolition waste",
      icon: Package,
      color: "text-gray-500"
    }
  ];

  useEffect(() => {
    if (user?.role === 'service_provider') {
      fetchCurrentServices();
    }
  }, [user]);

  const fetchCurrentServices = async () => {
    try {
      const response = await api.get('/services/my-services');
      const services = response.data.data;
      setCurrentServices(services);
      
      // Extract current service categories
      const currentCategories = services.map(service => service.category);
      setSelectedServices(currentCategories);
    } catch (error) {
      console.error('Error fetching current services:', error);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get current pricing from existing services or use defaults
      const defaultPricing = {
        type: "fixed",
        basePrice: 500,
        unit: "service",
        currency: "Ksh"
      };

      // Create new services for selected categories that don't exist yet
      const newServices = selectedServices.filter(serviceId => 
        !currentServices.some(service => service.category === serviceId)
      );

      if (newServices.length > 0) {
        const serviceTypes = {
          residential_pickup: { name: 'Residential Pickup', description: 'Regular household waste collection', category: 'residential_pickup' },
          commercial_pickup: { name: 'Commercial Pickup', description: 'Business waste collection', category: 'commercial_pickup' },
          bulk_removal: { name: 'Bulk Item Removal', description: 'Large item disposal service', category: 'bulk_items' },
          recycling: { name: 'Recycling Services', description: 'Specialized recycling collection', category: 'recycling' },
          hazardous_waste: { name: 'Hazardous Waste', description: 'Safe disposal of hazardous materials', category: 'hazardous_waste' },
          construction_debris: { name: 'Construction Debris', description: 'Construction and demolition waste', category: 'construction_debris' }
        };

        const servicePromises = newServices.map(serviceType => {
          const serviceInfo = serviceTypes[serviceType];
          return api.post('/services', {
            name: serviceInfo.name,
            description: serviceInfo.description,
            category: serviceInfo.category,
            pricing: defaultPricing,
            duration: {
              estimated: 60,
              minimum: 30,
              maximum: 120
            },
            isActive: true
          });
        });

        await Promise.all(servicePromises);
      }

      // Remove services that are no longer selected
      const servicesToRemove = currentServices.filter(service => 
        !selectedServices.includes(service.category)
      );

      for (const service of servicesToRemove) {
        await api.delete(`/services/${service._id}`);
      }

      alert('Services updated successfully!');
      navigate('/services');
    } catch (error) {
      console.error('Error updating services:', error);
      alert('Failed to update services. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Manage Your Services
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select the services you want to offer. You can add or remove services at any time.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Available Service Categories
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Select the services you want to offer. Currently selected: {selectedServices.length} services
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {serviceTypes.map((service) => {
          const Icon = service.icon;
          const isSelected = selectedServices.includes(service.id);
          const isCurrent = currentServices.some(s => s.category === service.id);

          return (
            <div
              key={service.id}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
              }`}
              onClick={() => handleServiceToggle(service.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Icon className={`w-6 h-6 ${service.color}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Currently Active
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {service.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {isSelected ? 'Selected' : 'Click to select'}
                </span>
                {isCurrent && (
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/services')}
          className="btn-secondary"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Update Services
            </>
          )}
        </button>
      </div>

      {selectedServices.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Summary
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            You have selected {selectedServices.length} service(s). 
            {selectedServices.length > currentServices.length && 
              ` ${selectedServices.length - currentServices.length} new service(s) will be added.`
            }
            {selectedServices.length < currentServices.length && 
              ` ${currentServices.length - selectedServices.length} service(s) will be removed.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AddServices; 