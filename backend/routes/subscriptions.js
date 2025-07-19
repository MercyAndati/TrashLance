const express = require("express")
const router = express.Router()
const { getSubscriptionStatus, updateSubscription } = require("../controllers/subscriptionController")
const { authenticateToken } = require("../middleware/auth")

// Must be logged in to manage subscriptions
router.use(authenticateToken)

// Get current subscription status
router.get("/status", getSubscriptionStatus)

// Update subscription plan
router.put("/update", updateSubscription)

module.exports = router
