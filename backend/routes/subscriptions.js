const express = require("express")
const router = express.Router()
const { getSubscriptionStatus, updateSubscription, getAvailablePlans } = require("../controllers/subscriptionController")
const { authenticateToken } = require("../middleware/auth")

// Public: Get available plans
router.get("/plans", getAvailablePlans)

// Must be logged in to manage subscriptions
router.use(authenticateToken)

// Get current subscription status
router.get("/status", getSubscriptionStatus)

// Update subscription plan
router.put("/update", updateSubscription)

module.exports = router
