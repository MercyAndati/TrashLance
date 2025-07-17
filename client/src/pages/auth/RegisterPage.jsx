"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const RegisterPage = ({ isCollector = false }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: isCollector ? "service_provider" : "customer",
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")

  const { register } = useAuth()
  const navigate = useNavigate()

  const validateField = (name, value) => {
    const newErrors = { ...errors }

    switch (name) {
      case "username":
        if (!value) {
          newErrors.username = "Username is required"
        } else if (value.length < 3) {
          newErrors.username = "Username must be at least 3 characters"
        } else if (value.length > 30) {
          newErrors.username = "Username cannot exceed 30 characters"
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = "Username can only contain letters, numbers, and underscores"
        } else {
          delete newErrors.username
        }
        break
      case "email":
        if (!value) {
          newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = "Please enter a valid email address"
        } else {
          delete newErrors.email
        }
        break
      case "password":
        if (!value) {
          newErrors.password = "Password is required"
        } else if (value.length < 6) {
          newErrors.password = "Password must be at least 6 characters"
        } else if (!/(?=.*[a-z])/.test(value)) {
          newErrors.password = "Password must contain at least one lowercase letter"
        } else if (!/(?=.*[A-Z])/.test(value)) {
          newErrors.password = "Password must contain at least one uppercase letter"
        } else if (!/(?=.*\d)/.test(value)) {
          newErrors.password = "Password must contain at least one number"
        } else {
          delete newErrors.password
        }
        break
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Please confirm your password"
        } else if (value !== formData.password) {
          newErrors.confirmPassword = "Passwords do not match"
        } else {
          delete newErrors.confirmPassword
        }
        break
      case "phone":
        if (!value) {
          newErrors.phone = "Phone number is required"
        } else if (!/^\+?[\d\s-()]+$/.test(value)) {
          newErrors.phone = "Please enter a valid phone number"
        } else {
          delete newErrors.phone
        }
        break
      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getPasswordStrength = (password) => {
    let strength = 0
    const checks = [
      password.length >= 6,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ]

    strength = checks.filter(Boolean).length

    if (strength <= 2) return { level: "weak", color: "red", text: "Weak" }
    if (strength <= 3) return { level: "medium", color: "yellow", text: "Medium" }
    if (strength <= 4) return { level: "strong", color: "green", text: "Strong" }
    return { level: "very-strong", color: "green", text: "Very Strong" }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Real-time validation
    if (errors[name]) {
      validateField(name, value)
    }

    // Special case for confirm password when password changes
    if (name === "password" && formData.confirmPassword) {
      validateField("confirmPassword", formData.confirmPassword)
    }

    // Clear general error when user starts typing
    if (generalError) {
      setGeneralError("")
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError("")

    // Validate all fields
    const validations = [
      validateField("username", formData.username),
      validateField("email", formData.email),
      validateField("password", formData.password),
      validateField("confirmPassword", formData.confirmPassword),
      validateField("phone", formData.phone),
    ]

    if (!validations.every(Boolean)) {
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registrationData } = formData
      const result = await register(registrationData)

      if (result.success) {
        if (isCollector) {
          navigate("/collector-onboarding")
        } else {
          navigate("/dashboard")
        }
      } else {
        setGeneralError(result.message)
      }
    } catch (error) {
      setGeneralError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isCollector ? "Join as a Collector" : "Create Your Account"}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isCollector ? "Start offering your waste management services" : "Join Trashlance and make a difference"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg">
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400 text-sm">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.username
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Choose a username"
                />
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.email
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.phone
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.password
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.color === "red"
                            ? "bg-red-500"
                            : passwordStrength.color === "yellow"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${passwordStrength.level === "weak" ? 25 : passwordStrength.level === "medium" ? 50 : passwordStrength.level === "strong" ? 75 : 100}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.color === "red"
                          ? "text-red-600 dark:text-red-400"
                          : passwordStrength.color === "yellow"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : formData.confirmPassword && !errors.confirmPassword
                        ? "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                !errors.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Passwords match
                  </p>
                )}
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <LoadingSpinner size="sm" /> : `Create ${isCollector ? "Collector" : "User"} Account`}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
              >
                Sign in here
              </Link>
            </p>
            {!isCollector && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Want to offer services?{" "}
                <Link
                  to="/register/collector"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  Sign up as Collector
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
