"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // Try to load user from localStorage first
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`
        const response = await api.get("/auth/me")
        // Set and store the plain user object
        setUser(response.data.data.user)
        localStorage.setItem("user", JSON.stringify(response.data.data.user))
      } else {
        setUser(null)
        localStorage.removeItem("user")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      delete api.defaults.headers.common["Authorization"]
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials)
      const { token, user } = response.data.data

      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      return { success: true, user }
    } catch (error) {
      console.error("Login failed:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

  const register = async (userData) => {
    try {
      console.log("Registering user:", userData)

      // Prepare the registration data
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        phone: userData.phone,
      }

      // Add role-specific data
      if (userData.role === "service_provider") {
        registrationData.serviceProvider = {
          businessName: userData.businessName,
          businessType: userData.businessType,
          servicesOffered: userData.servicesOffered || [],
          operatingHours: userData.operatingHours || {
            monday: { start: "09:00", end: "17:00", isOpen: true },
            tuesday: { start: "09:00", end: "17:00", isOpen: true },
            wednesday: { start: "09:00", end: "17:00", isOpen: true },
            thursday: { start: "09:00", end: "17:00", isOpen: true },
            friday: { start: "09:00", end: "17:00", isOpen: true },
            saturday: { start: "09:00", end: "17:00", isOpen: true },
            sunday: { start: "09:00", end: "17:00", isOpen: false },
          },
          pricing: userData.pricing || {
            currency: "USD",
            startingPrice: 0,
          },
          serviceAreas: userData.serviceAreas || [],
        }
      }

      // Add location data if provided
      if (userData.location) {
        registrationData.location = userData.location
      }

      // Add bio if provided
      if (userData.bio) {
        registrationData.bio = userData.bio
      }

      console.log("Sending registration data:", registrationData)

      const response = await api.post("/auth/register", registrationData)
      console.log("Registration response:", response.data)

      const { token, user } = response.data.data

      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      return { success: true, user }
    } catch (error) {
      console.error("Registration failed:", error)
      console.error("Error response:", error.response?.data)
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
        details: error.response?.data?.details || null,
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
