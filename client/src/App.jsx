"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { NotificationProvider } from "./contexts/NotificationContext"

// Components
import Navbar from "./components/layout/Navbar"
import Sidebar from "./components/layout/Sidebar"
import Footer from "./components/layout/Footer"
import LoadingSpinner from "./components/common/LoadingSpinner"

// Pages
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "./pages/auth/ResetPasswordPage"
import Dashboard from "./pages/Dashboard"
import Profile from "./pages/Profile"
import Bookings from "./pages/Bookings"
import BookingDetails from "./pages/BookingDetails"
import Posts from "././pages/Posts"
import PostDetails from "./pages/PostDetails"
import CreatePost from "./pages/CreatePost"
import Chat from "./pages/Chat"
import Leaderboard from "./pages/Leaderboard"
import Settings from "./pages/Settings"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminPosts from "./pages/admin/AdminPosts"
import CollectorOnboarding from "./pages/CollectorOnboarding"
import SubscriptionManagement from "./pages/SubscriptionManagement"
import MyServices from "./pages/MyServices"
import AddServices from "./pages/AddServices"
import Locations from "./pages/Locations"
import ManageLocations from "./pages/ManageLocations"

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Layout Component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        {user && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main className={`flex-1 ${user ? "lg:ml-64" : ""} transition-all duration-300`}>
          <div className="min-h-screen">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register/collector" element={<RegisterPage isCollector={true} />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile/:id"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/collector-onboarding"
                  element={
                    <ProtectedRoute requiredRole="service_provider">
                      <CollectorOnboarding />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <Bookings />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/bookings/:id"
                  element={
                    <ProtectedRoute>
                      <BookingDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/posts"
                  element={
                    <ProtectedRoute>
                      <Posts />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/posts/:id"
                  element={
                    <ProtectedRoute>
                      <PostDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/create-post"
                  element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute requiredRole="service_provider">
                      <SubscriptionManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/services"
                  element={
                    <ProtectedRoute requiredRole="service_provider">
                      <MyServices />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/services/add"
                  element={
                    <ProtectedRoute requiredRole="service_provider">
                      <AddServices />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/locations"
                  element={<Locations />}
                />

                <Route
                  path="/manage-locations"
                  element={
                    <ProtectedRoute requiredRole="service_provider">
                      <ManageLocations />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/posts"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPosts />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
