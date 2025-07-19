const express = require("express")
const router = express.Router()
const {
  getUserById,
  updateUserProfile,
  uploadAvatar,
  getLeaderboard,
  getUserStats,
  searchUsers,
  completeOnboarding,
  getLocations,
  getCollectorsByLocation,
} = require("../controllers/userController")
const { authenticateToken } = require("../middleware/auth")
const { validateObjectId, handleValidationErrors } = require("../middleware/validation")
const { avatarUpload } = require("../config/cloudinary")

// Public routes
router.get("/leaderboard", getLeaderboard) // FIXED: Remove ID validation
router.get("/search", searchUsers)
router.get("/locations", getLocations)
router.get("/locations/:location/collectors", getCollectorsByLocation)

// Protected routes
router.use(authenticateToken)

router.get("/stats", getUserStats)
router.get("/:id", validateObjectId("id"), getUserById)
router.put("/profile", updateUserProfile)
router.post("/avatar", avatarUpload.single("avatar"), uploadAvatar)
router.post("/complete-onboarding", completeOnboarding)

module.exports = router
