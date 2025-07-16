const express = require("express")
const router = express.Router()
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByProvider,
} = require("../controllers/serviceController")
const { authenticateToken } = require("../middleware/auth")
const { validateService, validateObjectId } = require("../middleware/validation")

// ✅ Public routes - specific routes MUST come before parameterized routes
router.get("/", getAllServices)

// ✅ This specific route must come BEFORE /:id to avoid conflicts
router.get("/provider/:providerId", validateObjectId("providerId"), getServicesByProvider)

// ✅ Parameterized routes come after specific routes
router.get("/:id", validateObjectId("id"), getServiceById)

// ✅ Protected routes
router.post("/", authenticateToken, validateService, createService)
router.put("/:id", authenticateToken, validateObjectId("id"), validateService, updateService)
router.delete("/:id", authenticateToken, validateObjectId("id"), deleteService)

module.exports = router
