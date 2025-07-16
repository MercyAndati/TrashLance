const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  updateLocation,
  addMessage,
  cancelBooking
} = require('../controllers/bookingController');

const { authenticateToken, requireEmailVerification } = require('../middleware/auth');
const { validateBooking, validateObjectId, validatePagination } = require('../middleware/validation');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);
//router.use(requireEmailVerification);

// Get user bookings
router.get('/', validatePagination, getUserBookings);

// Create booking
router.post('/', validateBooking, createBooking);

// Get booking by ID
router.get('/:id', validateObjectId('id'), getBookingById);

// Update booking status
router.patch('/:id/status', [
  validateObjectId('id'),
  body('status').isIn(['confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  body('notes').optional().trim().isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
], updateBookingStatus);

// Update location (for service providers)
router.patch('/:id/location', [
  validateObjectId('id'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('estimatedArrival').optional().isISO8601().toDate()
    .withMessage('Invalid estimated arrival time')
], updateLocation);

// Add communication message
router.post('/:id/messages', [
  validateObjectId('id'),
  body('message').trim().isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('type').optional().isIn(['message', 'system', 'status_update'])
    .withMessage('Invalid message type')
], addMessage);

// Cancel booking
router.patch('/:id/cancel', [
  validateObjectId('id'),
  body('reason').trim().isLength({ min: 1, max: 500 })
    .withMessage('Cancellation reason is required and cannot exceed 500 characters')
], cancelBooking);

module.exports = router;