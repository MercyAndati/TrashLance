const express = require("express")
const router = express.Router()
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
  logout,
} = require("../controllers/authController")
const { authenticateToken } = require("../middleware/auth")
const { validateUserRegistration, validateUserLogin, handleValidationErrors } = require("../middleware/validation")
const { body } = require("express-validator")

// Public routes
router.post("/register", validateUserRegistration, register)
router.post("/login", validateUserLogin, login)

// Email verification
router.get("/verify-email/:token", verifyEmail)

// Password reset
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"), handleValidationErrors],
  forgotPassword,
)

router.post(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    handleValidationErrors,
  ],
  resetPassword,
)

// Protected routes
router.use(authenticateToken)

// Current user
router.get("/me", getCurrentUser)

// Email verification (resend)
router.post("/resend-email-verification", resendEmailVerification)

// Phone verification
router.post("/send-phone-verification", sendPhoneVerification)
router.post(
  "/verify-phone",
  [body("code").isLength({ min: 6, max: 6 }).withMessage("Verification code must be 6 digits"), handleValidationErrors],
  verifyPhone,
)

// Change password
router.post(
  "/change-password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
    handleValidationErrors,
  ],
  changePassword,
)

// Logout
router.post("/logout", logout)

module.exports = router
