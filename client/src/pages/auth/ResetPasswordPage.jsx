"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from "lucide-react"
import api from "../../services/api"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const ResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      // Make unauthenticated request for token validation
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/validate-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })
      
      if (!response.ok) {
        throw new Error('Token validation failed')
      }
      
      setTokenValid(true)
    } catch (error) {
      setError("Invalid or expired reset token")
      setTokenValid(false)
    } finally {
      setValidatingToken(false)
    }
  }

  const validateField = (name, value) => {
    const newErrors = { ...errors }

    switch (name) {
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
      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      validateField(name, value)
    }

    if (name === "password" && formData.confirmPassword) {
      validateField("confirmPassword", formData.confirmPassword)
    }

    if (error) setError("")
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    const isPasswordValid = validateField("password", formData.password)
    const isConfirmPasswordValid = validateField("confirmPassword", formData.confirmPassword)

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return
    }

    setLoading(true)

    try {
      // Make unauthenticated request for password reset
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: formData.password })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reset password')
      }

      setMessage("Password reset successfully! Redirecting to login...")
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (error) {
      setError(error.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Invalid Reset Link</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">This password reset link is invalid or has expired.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Please request a new password reset link to continue.
              </p>
              <Link
                to="/forgot-password"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Your Password</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Enter your new password below</p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-700 dark:text-green-400 text-sm">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
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
                  placeholder="Enter your new password"
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
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm New Password
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
                  placeholder="Confirm your new password"
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
              {loading ? <LoadingSpinner size="sm" /> : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
