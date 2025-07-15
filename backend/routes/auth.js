const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  resendEmailVerification,
  sendPhoneVerification,
  verifyPhone,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  logout
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors
} = require('../middleware/validation');
const { body } = require('express-validator');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  handleValidationErrors
], forgotPassword);
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
], resetPassword);

// Protected routes
router.use(authenticateToken);

router.get('/me', getCurrentUser);
router.post('/logout', logout);
router.post('/resend-email-verification', resendEmailVerification);
router.post('/send-phone-verification', sendPhoneVerification);
router.post('/verify-phone', [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  handleValidationErrors
], verifyPhone);
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors
], changePassword);

module.exports = router;