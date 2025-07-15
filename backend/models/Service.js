const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'residential_pickup',
      'commercial_pickup',
      'recycling',
      'hazardous_waste',
      'construction_debris',
      'yard_waste',
      'electronic_waste',
      'bulk_items',
      'medical_waste',
      'industrial_waste'
    ]
  },
  pricing: {
    type: {
      type: String,
      enum: ['fixed', 'per_hour', 'per_weight', 'per_volume', 'custom'],
      required: true
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    unit: {
      type: String,
      enum: ['service', 'hour', 'kg', 'ton', 'cubic_meter', 'bag', 'item'],
      required: true
    },
    additionalFees: [{
      name: String,
      amount: Number,
      description: String
    }]
  },
  duration: {
    estimated: {
      type: Number, // in minutes
      required: [true, 'Estimated duration is required']
    },
    minimum: Number,
    maximum: Number
  },
  availability: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    timeSlots: [{
      start: String, // HH:MM format
      end: String,   // HH:MM format
      maxBookings: { type: Number, default: 1 }
    }]
  },
  requirements: {
    minimumNotice: {
      type: Number, // in hours
      default: 24
    },
    accessRequirements: [String],
    specialInstructions: String,
    equipmentProvided: [String],
    customerPreparation: [String]
  },
  serviceArea: {
    type: {
      type: String,
      enum: ['radius', 'zones'],
      default: 'radius'
    },
    radius: Number, // in kilometers
    zones: [String], // zip codes or area names
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  bookingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for text search
serviceSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

// Index for geospatial queries
serviceSchema.index({ "serviceArea.coordinates": "2dsphere" });

// Virtual for formatted price
serviceSchema.virtual('formattedPrice').get(function() {
  const { basePrice, unit, type } = this.pricing;
  let unitText = unit;
  
  switch(unit) {
    case 'service': unitText = 'service'; break;
    case 'hour': unitText = 'hour'; break;
    case 'kg': unitText = 'kg'; break;
    case 'ton': unitText = 'ton'; break;
    case 'cubic_meter': unitText = 'm³'; break;
    case 'bag': unitText = 'bag'; break;
    case 'item': unitText = 'item'; break;
  }
  
  return `$${basePrice}/${unitText}`;
});

module.exports = mongoose.model('Service', serviceSchema);