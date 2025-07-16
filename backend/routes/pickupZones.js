const express = require("express")
const router = express.Router()
const {
  getAllZones,
  searchZonesByLocation,
  getZoneDetails,
  addProviderToZone,
  removeProviderFromZone,
  createZone,
} = require("../controllers/pickupZoneController")
const { authenticateToken } = require("../middleware/auth")
const { handleValidationErrors } = require("../middleware/validation")
const { body, query, param } = require("express-validator")

// Inline validation helpers
const validateZoneId = [param("id").isMongoId().withMessage("Invalid zone ID"), handleValidationErrors]

const validateZoneIdParam = [param("zoneId").isMongoId().withMessage("Invalid zone ID"), handleValidationErrors]

// Public routes
router.get("/", getAllZones)

router.get(
  "/search",
  [
    query("lat").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    query("lng").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
    query("radius").optional().isFloat({ min: 1, max: 100 }).withMessage("Radius must be between 1-100 km"),
    handleValidationErrors,
  ],
  searchZonesByLocation,
)

router.get("/:id", validateZoneId, getZoneDetails)

// Protected routes
router.use(authenticateToken)

// Service provider routes
router.post(
  "/join",
  [
    body("zoneId").isMongoId().withMessage("Valid zone ID required"),
    body("serviceIds").isArray({ min: 1 }).withMessage("At least one service ID required"),
    body("serviceIds.*").isMongoId().withMessage("Valid service IDs required"),
    handleValidationErrors,
  ],
  addProviderToZone,
)

router.delete("/:zoneId/leave", validateZoneIdParam, removeProviderFromZone)

// Admin routes - simplified without requireAdmin for now
router.post(
  "/",
  [
    body("name").trim().isLength({ min: 3, max: 100 }).withMessage("Zone name must be 3-100 characters"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    body("center.latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid center latitude required"),
    body("center.longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid center longitude required"),
    handleValidationErrors,
  ],
  createZone,
)

module.exports = router
