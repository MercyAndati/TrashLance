const express = require("express")
const router = express.Router()
const { subscribe, getCurrentPlan, getAvailablePlans } = require("../controllers/subscriptionController")
const { authenticateToken } = require("../middleware/auth")

// Must be logged in to manage subscriptions
router.use(authenticateToken)

// ✅ Specific routes first
router.get("/plans", getAvailablePlans)
router.get("/current", getCurrentPlan)

// ✅ Then POST routes
router.post("/", subscribe)

module.exports = router
