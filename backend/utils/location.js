const axios = require('axios');

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Distance in kilometers
};

// Convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Geocode address using Google Maps API
const geocodeAddress = async (address) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components
      };
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    console.error('Geocoding failed:', error);
    throw error;
  }
};

// Reverse geocode coordinates to address
const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components
      };
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    throw error;
  }
};

// Get route between two points
const getRoute = async (origin, destination) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      return {
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps,
        polyline: route.overview_polyline.points
      };
    } else {
      throw new Error('Route not found');
    }
  } catch (error) {
    console.error('Route calculation failed:', error);
    throw error;
  }
};

// Check if point is within service area
const isWithinServiceArea = (userLocation, serviceLocation, radiusKm) => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    serviceLocation.latitude,
    serviceLocation.longitude
  );
  
  return distance <= radiusKm;
};

// Find nearby service providers
const findNearbyProviders = async (userLocation, providers, maxDistance = 50) => {
  const nearbyProviders = providers
    .map(provider => {
      if (!provider.address?.coordinates) return null;
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        provider.address.coordinates.latitude,
        provider.address.coordinates.longitude
      );
      
      return distance <= maxDistance ? { ...provider.toObject(), distance } : null;
    })
    .filter(provider => provider !== null)
    .sort((a, b) => a.distance - b.distance);
  
  return nearbyProviders;
};

// Validate coordinates
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Format address for display
const formatAddress = (addressComponents) => {
  const components = {};
  
  addressComponents.forEach(component => {
    component.types.forEach(type => {
      components[type] = component.long_name;
    });
  });
  
  return {
    street: `${components.street_number || ''} ${components.route || ''}`.trim(),
    city: components.locality || components.administrative_area_level_2 || '',
    state: components.administrative_area_level_1 || '',
    zipCode: components.postal_code || '',
    country: components.country || ''
  };
};

module.exports = {
  calculateDistance,
  geocodeAddress,
  reverseGeocode,
  getRoute,
  isWithinServiceArea,
  findNearbyProviders,
  validateCoordinates,
  formatAddress
};