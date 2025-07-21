"use client"

import { useState } from "react"
import { Bell, Shield, User, Globe, Moon, Sun, Smartphone, Mail, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"
import { useNavigate } from "react-router-dom"

const Settings = () => {
  const { user, updateUser, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    bookingUpdates: true,
    messageNotifications: true,
    marketingEmails: false,
  })
  const navigate = useNavigate();

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Globe },
  ]

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    setLoading(true)
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      alert("Password changed successfully")
    } catch (error) {
      alert(error.response?.data?.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async (key, value) => {
    const updatedNotifications = { ...notifications, [key]: value }
    setNotifications(updatedNotifications)

    try {
      await api.put("/users/notifications", updatedNotifications)
    } catch (error) {
      console.error("Failed to update notifications:", error)
    }
  }

  // Add delete account handler
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await api.delete("/users/profile");
      logout();
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Profile Information</h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <p className="text-gray-900 dark:text-white text-sm sm:text-base">{user.username}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <p className="text-gray-900 dark:text-white text-sm sm:text-base">{user.email}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <p className="text-gray-900 dark:text-white text-sm sm:text-base">{user.phone}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <p className="text-gray-900 dark:text-white text-sm sm:text-base capitalize">{user.role?.replace("_", " ")}</p>
            </div>
          </div>
          <div className="mt-4">
            <button className="btn-primary text-sm px-4 py-2">Edit Profile</button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4 text-center">
            <h4 className="font-medium text-green-900 dark:text-green-300 text-sm">Points Earned</h4>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{user.points || 0}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 text-center">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 text-sm">Member Since</h4>
            <p className="text-blue-600 dark:text-blue-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4 text-center">
            <h4 className="font-medium text-purple-900 dark:text-purple-300 text-sm">Account Status</h4>
            <p className="text-purple-600 dark:text-purple-400 text-sm">Active</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Notification Preferences</h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Email Notifications</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => handleNotificationUpdate("email", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Push Notifications</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Receive push notifications in browser</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => handleNotificationUpdate("push", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">SMS Notifications</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Receive important updates via SMS</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.sms}
                onChange={(e) => handleNotificationUpdate("sms", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Notification Types</h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Booking Updates</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Status changes for your bookings</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.bookingUpdates}
                onChange={(e) => handleNotificationUpdate("bookingUpdates", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Message Notifications</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">New messages from other users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.messageNotifications}
                onChange={(e) => handleNotificationUpdate("messageNotifications", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Marketing Emails</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Updates about new features and promotions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.marketingEmails}
                onChange={(e) => handleNotificationUpdate("marketingEmails", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input-field pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-field pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary text-sm px-4 py-2 flex items-center">
            {loading ? <LoadingSpinner size="sm" /> : "Change Password"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Account Security</h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Two-Factor Authentication</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
            </div>
            <button className="btn-secondary text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">Enable</button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Login Alerts</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Get notified of new login attempts</p>
            </div>
            <button className="btn-secondary text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">Configure</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPreferences = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Appearance</h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              {isDark ? <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Dark Mode</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Switch between light and dark themes</p>
              </div>
            </div>
            <button onClick={toggleTheme} className="btn-secondary text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
              {isDark ? "Switch to Light" : "Switch to Dark"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Language & Region</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
            <select className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Zone</label>
            <select className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Data & Privacy</h3>
        <div className="space-y-3 sm:space-y-4">
          <button className="w-full text-left p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Download Your Data</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Get a copy of your account data</p>
          </button>

          <button
            className="w-full text-left p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-between"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            <div>
              <p className="font-medium text-red-900 dark:text-red-300 text-sm sm:text-base">Delete Account</p>
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">Permanently delete your account and data</p>
            </div>
            {loading && <LoadingSpinner size="sm" />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Mobile Tab Navigation */}
          <div className="block lg:hidden border-b border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors ${
                      activeTab === tab.id
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-b-2 border-green-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-1/4 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
              <nav className="space-y-1 p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6">
              {activeTab === "profile" && renderProfileSettings()}
              {activeTab === "notifications" && renderNotificationSettings()}
              {activeTab === "security" && renderSecuritySettings()}
              {activeTab === "preferences" && renderPreferences()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings