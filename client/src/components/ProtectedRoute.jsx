"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "./common/LoadingSpinner"

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    // User is not authenticated, redirect to login page
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User is authenticated but does not have the allowed role, redirect to dashboard or unauthorized page
    return <Navigate to="/dashboard" replace /> // Or a specific unauthorized page
  }

  return children
}

export default ProtectedRoute
