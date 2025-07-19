const express = require('express');
const router = express.Router();
const {
  getMyServices,
  createService,
  updateService,
  deleteService,
  getServiceById,
  getAllServices
} = require('../controllers/serviceController');
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// Protected routes
router.use(authenticateToken);

// Service provider routes - these must come before parameterized routes
router.get('/my-services', getMyServices);
router.post('/', createService);
router.put('/:id', validateObjectId('id'), updateService);
router.delete('/:id', validateObjectId('id'), deleteService);

// Public routes - these come after specific routes
router.get('/', getAllServices);
router.get('/:id', validateObjectId('id'), getServiceById);

module.exports = router;
