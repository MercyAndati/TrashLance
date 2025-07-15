const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage for different file types
const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'gif']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `trashlance/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    }
  });
};

// Storage configurations
const avatarStorage = createStorage('avatars');
const serviceImageStorage = createStorage('services');
const bookingImageStorage = createStorage('bookings');
const documentStorage = createStorage('documents', ['jpg', 'jpeg', 'png', 'pdf']);

// Multer configurations
const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const serviceImageUpload = multer({
  storage: serviceImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const bookingImageUpload = multer({
  storage: bookingImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maximum 10 images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 5 // Maximum 5 documents
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Helper functions
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

const getImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, transformations);
};

// Image transformation presets
const transformations = {
  thumbnail: { width: 150, height: 150, crop: 'fill' },
  medium: { width: 500, height: 500, crop: 'limit' },
  large: { width: 1000, height: 1000, crop: 'limit' },
  avatar: { width: 200, height: 200, crop: 'fill', gravity: 'face' }
};

module.exports = {
  cloudinary,
  avatarUpload,
  serviceImageUpload,
  bookingImageUpload,
  documentUpload,
  deleteImage,
  getImageUrl,
  transformations
};