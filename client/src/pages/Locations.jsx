import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { MapPin, Users, Star, Phone, Mail, Calendar, Package } from 'lucide-react';

const Locations = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [collectorsLoading, setCollectorsLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/locations');
      setLocations(response.data.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectorsByLocation = async (location) => {
    try {
      setCollectorsLoading(true);
      setSelectedLocation(location);
      const response = await api.get(`/users/locations/${encodeURIComponent(location)}/collectors`);
      setCollectors(response.data.data);
    } catch (error) {
      console.error('Error fetching collectors:', error);
    } finally {
      setCollectorsLoading(false);
    }
  };

  const getLocationStats = (location) => {
    const locationCollectors = collectors.filter(collector => 
      collector.serviceProvider?.serviceLocations?.includes(location)
    );
    return {
      totalCollectors: locationCollectors.length,
      averageRating: locationCollectors.length > 0 
        ? (locationCollectors.reduce((sum, c) => sum + (c.serviceProvider?.rating?.average || 0), 0) / locationCollectors.length).toFixed(1)
        : 0
    };
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Service Locations
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find collectors in your area and book their services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Locations List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Available Locations
          </h2>
          <div className="space-y-3">
            {locations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No locations available yet</p>
              </div>
            ) : (
              locations.map((location) => {
                const stats = getLocationStats(location);
                const isSelected = selectedLocation === location;
                
                return (
                  <div
                    key={location}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                    }`}
                    onClick={() => fetchCollectorsByLocation(location)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {location}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.totalCollectors} collectors available
                          </p>
                        </div>
                      </div>
                      {stats.averageRating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {stats.averageRating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Collectors List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {selectedLocation ? `Collectors in ${selectedLocation}` : 'Select a location to view collectors'}
          </h2>
          
          {selectedLocation && (
            <div>
              {collectorsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading collectors...</p>
                </div>
              ) : collectors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No collectors available in this location</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {collectors.map((collector) => (
                    <div
                      key={collector._id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {collector.avatar ? (
                            <img
                              src={collector.avatar}
                              alt={collector.username}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                {collector.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {collector.serviceProvider?.companyName || collector.username}
                            </h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {collector.serviceProvider?.rating?.average?.toFixed(1) || 'New'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {collector.serviceProvider?.serviceLocations}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center space-x-1">
                              <Package className="w-4 h-4" />
                              <span>{collector.serviceProvider?.servicesOffered?.length || 0} services</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{collector.serviceProvider?.serviceRadius || 10}km radius</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/profile/${collector._id}`}
                              className="btn-secondary text-sm"
                            >
                              View Profile
                            </Link>
                            {user?.role === 'customer' && (
                              <Link
                                to={`/bookings/create?provider=${collector._id}`}
                                className="btn-primary text-sm"
                              >
                                Book Service
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Locations; 