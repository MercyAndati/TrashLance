const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  verifyCollector,
  deleteUserByAdmin,
  createGovernmentAccount
} = require('../controllers/adminController');

const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes here are protected and for admins only
router.use(authenticateToken, requireAdmin);

// Get all users (optionally filter by role)
router.get('/users', getAllUsers);

// Verify or reject a collector
router.put('/verify/:id', verifyCollector);

// Delete user
router.delete('/users/:id', deleteUserByAdmin);

// Create a government account
router.post('/create-government', createGovernmentAccount);

module.exports = router;
