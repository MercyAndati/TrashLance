const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const { sendEmail } = require("../utils/email")
const { sendSMS } = require("../utils/sms")

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "20d",
  })
}

// Register user
const register = async (req, res) => {
  try {
    const { username, email, password, phone, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }, { username }],
    })

    if (existingUser) {
      let message = "User already exists"
      if (existingUser.email === email) message = "Email already registered"
      else if (existingUser.phone === phone) message = "Phone number already registered"
      else if (existingUser.username === username) message = "Username already taken"

      return res.status(400).json({
        success: false,
        message,
      })
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      phone,
      role: role || "customer",
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        token,
        user: user.getPublicProfile(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user and include password
    const user = await User.findOne({ email }).select("+password")
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: user.getPublicProfile(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Send phone verification
const sendPhoneVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: "Phone number is already verified",
      })
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    user.phoneVerificationCode = verificationCode
    user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
    await user.save()

    // Send SMS
    await sendSMS({
      to: user.phone,
      message: `Your Trashlance verification code is: ${verificationCode}. Valid for 10 minutes.`,
    })

    res.json({
      success: true,
      message: "Verification code sent to your phone",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send verification code",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Verify phone
const verifyPhone = async (req, res) => {
  try {
    const { code } = req.body
    const user = await User.findById(req.user._id)

    if (!user.phoneVerificationCode || user.phoneVerificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Verification code expired or not found",
      })
    }

    if (user.phoneVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      })
    }

    // Update user
    user.isPhoneVerified = true
    user.phoneVerificationCode = undefined
    user.phoneVerificationExpires = undefined
    await user.save()

    res.json({
      success: true,
      message: "Phone number verified successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Phone verification failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000 // 30 minutes
    await user.save()

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    await sendEmail({
      to: user.email,
      subject: "Password Reset - Trashlance",
      template: "passwordReset",
      data: {
        username: user.username,
        resetUrl,
      },
    })

    res.json({
      success: true,
      message: "Password reset email sent",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send password reset email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Validate reset token
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      })
    }

    // Hash token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    res.json({
      success: true,
      message: "Reset token is valid",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Token validation failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    // Hash token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    // Update password
    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // Generate new token
    const newToken = generateToken(user._id)

    res.json({
      success: true,
      message: "Password reset successful",
      data: {
        token: newToken,
        user: user.getPublicProfile(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select("+password")

    // Verify current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("serviceProvider.servicesOffered")

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Logout (client-side token removal, but we can track it)
const logout = async (req, res) => {
  try {
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    // Hash token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      })
    }

    // Update user
    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    res.json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Resend email verification
const resendEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      })
    }

    // Generate new token
    const emailToken = crypto.randomBytes(32).toString("hex")
    user.emailVerificationToken = crypto.createHash("sha256").update(emailToken).digest("hex")
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    await user.save()

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${emailToken}`
    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - Trashlance",
      template: "emailVerification",
      data: {
        username: user.username,
        verificationUrl,
      },
    })

    res.json({
      success: true,
      message: "Verification email sent",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send verification email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendEmailVerification,
  sendPhoneVerification,
  verifyPhone,
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword,
  getCurrentUser,
  logout,
}
