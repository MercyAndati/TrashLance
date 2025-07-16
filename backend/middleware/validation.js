const { body, param, query, validationResult } = require("express-validator")

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    })
  }
  next()
}

// User validation rules
const validateUserRegistration = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

  body("phone").isMobilePhone().withMessage("Please provide a valid phone number"),

  body("role")
    .optional()
    .isIn(["customer", "service_provider"])
    .withMessage("Role must be either customer or service_provider"),

  handleValidationErrors,
]

const validateUserLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
]

// Service validation rules
const validateService = [
  body("name").trim().isLength({ min: 3, max: 100 }).withMessage("Service name must be between 3 and 100 characters"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),

  body("category")
    .isIn([
      "residential_pickup",
      "commercial_pickup",
      "recycling",
      "hazardous_waste",
      "construction_debris",
      "yard_waste",
      "electronic_waste",
      "bulk_items",
      "medical_waste",
      "industrial_waste",
    ])
    .withMessage("Invalid service category"),

  body("pricing.type")
    .isIn(["fixed", "per_hour", "per_weight", "per_volume", "custom"])
    .withMessage("Invalid pricing type"),

  body("pricing.basePrice").isFloat({ min: 0 }).withMessage("Base price must be a positive number"),

  body("pricing.unit")
    .isIn(["service", "hour", "kg", "ton", "cubic_meter", "bag", "item"])
    .withMessage("Invalid pricing unit"),

  body("duration.estimated").isInt({ min: 15 }).withMessage("Estimated duration must be at least 15 minutes"),

  handleValidationErrors,
]

// Booking validation rules
const validateBooking = [
  body("serviceProvider").isMongoId().withMessage("Invalid service provider ID"),

  body("service").isMongoId().withMessage("Invalid service ID"),

  body("scheduledDate")
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= new Date()) {
        throw new Error("Scheduled date must be in the future")
      }
      return true
    }),

  body("timeSlot.start")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Start time must be in HH:MM format"),

  body("timeSlot.end")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("End time must be in HH:MM format"),

  body("location.address.street").trim().notEmpty().withMessage("Street address is required"),

  body("location.address.city").trim().notEmpty().withMessage("City is required"),

  body("location.address.zipCode")
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("Invalid ZIP code format"),

  body("location.coordinates.latitude").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),

  body("location.coordinates.longitude").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),

  handleValidationErrors,
]

// Review validation rules
const validateReview = [
  body("rating.overall").isInt({ min: 1, max: 5 }).withMessage("Overall rating must be between 1 and 5"),

  body("rating.punctuality")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Punctuality rating must be between 1 and 5"),

  body("rating.quality").optional().isInt({ min: 1, max: 5 }).withMessage("Quality rating must be between 1 and 5"),

  body("rating.communication")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Communication rating must be between 1 and 5"),

  body("rating.value").optional().isInt({ min: 1, max: 5 }).withMessage("Value rating must be between 1 and 5"),

  body("review.title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Review title cannot exceed 100 characters"),

  body("review.content")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Review content must be between 10 and 1000 characters"),

  handleValidationErrors,
]

// Query validation rules
const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
]

const validateObjectId = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} ID`),

  handleValidationErrors,
]

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateService,
  validateBooking,
  validateReview,
  validatePagination,
  validateObjectId,
}
