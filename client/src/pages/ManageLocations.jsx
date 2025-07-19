import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { MapPin, Plus, X, Save, ArrowLeft } from 'lucide-react';

const ManageLocations = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState('');
  const [serviceRadius, setServiceRadius] = useState(10);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (user?.role === 'service_provider') {
      setLocations(user.serviceProvider?.serviceLocations || '');
      setServiceRadius(user.serviceProvider?.serviceRadius || 10);
    }
  }, [user]);

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      const currentLocations = locations ? locations.split(',').map(loc => loc.trim()) : [];
      if (!currentLocations.includes(newLocation.trim())) {
        const updatedLocations = [...currentLocations, newLocation.trim()].join(', ');
        setLocations(updatedLocations);
        setNewLocation('');
      }
    }
  };

  const handleRemoveLocation = (locationToRemove) => {
    const currentLocations = locations.split(',').map(loc => loc.trim());
    const updatedLocations = currentLocations.filter(loc => loc !== locationToRemove);
    setLocations(updatedLocations.join(', '));
  };

  const handleSave = async () => {
    if (!user || user.role !== 'service_provider') return;

    setLoading(true);
    try {
      const requestData = {
        serviceProvider: {
          serviceLocations: locations,
          serviceRadius: serviceRadius
        }
      };
      console.log('Sending request data:', requestData);
      const response = await api.put('/users/profile', requestData);

      // Update the user context
      updateUser(response.data.data);
      alert('Locations updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating locations:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to update locations: ${error.response?.data?.message || error.message}`);
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

  const locationList = locations ? locations.split(',').map(loc => loc.trim()).filter(loc => loc) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Service Locations
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Update your service areas and travel radius to help customers find you.
        </p>
      </div>

      <div className="space-y-8">
        {/* Service Radius */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Service Radius
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Travel Distance (kilometers)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={serviceRadius}
                onChange={(e) => setServiceRadius(parseInt(e.target.value) || 10)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                How far are you willing to travel for services?
              </p>
            </div>
          </div>
        </div>

        {/* Service Locations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Service Locations
          </h2>
          
          <div className="space-y-4">
            {/* Add New Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add New Location
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                  placeholder="Enter location name (e.g., Nairobi, Mombasa)"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleAddLocation}
                  disabled={!newLocation.trim()}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Press Enter or click Add to add a new location
              </p>
            </div>

            {/* Current Locations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Locations ({locationList.length})
              </label>
              
              {locationList.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No locations added yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Add your first location above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locationList.map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {location}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveLocation(location)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove location"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk Edit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bulk Edit (comma-separated)
              </label>
              <textarea
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="Enter locations separated by commas (e.g., Nairobi, Mombasa, Kisumu)"
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                You can also edit all locations at once using comma separation
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/profile')}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageLocations; 