"use client"

import { useState } from "react"
import { Bell, Shield, User, Globe, Moon, Sun, Smartphone, Mail, Eye, EyeOff, Menu, X } from "lucide-react"
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    setSidebarOpen(false) // Close sidebar on mobile after tab selection
  }

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <p className="text-gray-900 dark:text-white break-words">{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <p className="text-gray-900 dark:text-white break-all">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <p className="text-gray-900 dark:text-white">{user.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <p className="text-gray-900 dark:text-white capitalize">{user.role?.replace("_", " ")}</p>
            </div>
          </div>
          <div className="mt-6">
            <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors min-h-[44px]">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-300 text-sm sm:text-base">Points Earned</h4>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{user.points || 0}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 text-sm sm:text-base">Member Since</h4>
            <p className="text-blue-600 dark:text-blue-400 text-sm sm:text-base">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 dark:text-purple-300 text-sm sm:text-base">Account Status</h4>
            <p className="text-purple-600 dark:text-purple-400 text-sm sm:text-base">Active</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {[
            { key: "email", icon: Mail, title: "Email Notifications", description: "Receive notifications via email" },
            { key: "push", icon: Bell, title: "Push Notifications", description: "Receive push notifications in browser" },
            { key: "sms", icon: Smartphone, title: "SMS Notifications", description: "Receive important updates via SMS" }
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{item.title}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => handleNotificationUpdate(item.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Types</h3>
        <div className="space-y-4">
          {[
            { key: "bookingUpdates", title: "Booking Updates", description: "Status changes for your bookings" },
            { key: "messageNotifications", title: "Message Notifications", description: "New messages from other users" },
            { key: "marketingEmails", title: "Marketing Emails", description: "Updates about new features and promotions" }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{item.title}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={(e) => handleNotificationUpdate(item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: "currentPassword", label: "Current Password", type: "current" },
            { key: "newPassword", label: "New Password", type: "new" },
            { key: "confirmPassword", label: "Confirm New Password", type: "confirm" }
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>
              <div className="relative">
                <input
                  type={showPasswords[field.type] ? "text" : "password"}
                  value={passwordForm[field.key]}
                  onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, [field.type]: !showPasswords[field.type] })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[44px] min-w-[44px] justify-center"
                >
                  {showPasswords[field.type] ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          ))}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors min-h-[44px] flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="sm" /> : "Change Password"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Security</h3>
        <div className="space-y-4">
          {[
            { title: "Two-Factor Authentication", description: "Add an extra layer of security", action: "Enable" },
            { title: "Login Alerts", description: "Get notified of new login attempts", action: "Configure" }
          ].map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{item.title}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
              <button className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors min-h-[44px]">
                {item.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {isDark ? <Moon className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <Sun className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Dark Mode</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Switch between light and dark themes</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme} 
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors min-h-[44px]"
            >
              {isDark ? "Switch to Light" : "Switch to Dark"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Language & Region</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
            <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Zone</label>
            <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data & Privacy</h3>
        <div className="space-y-4">
          <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors min-h-[56px]">
            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Download Your Data</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Get a copy of your account data</p>
          </button>

          <button
            className="w-full text-left p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors min-h-[56px] flex items-center"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            <div className="flex-1">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>
                <div className="fixed left-0 top-0 h-full w-64 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <nav className="space-y-1">
                      {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-colors min-h-[48px] ${
                              activeTab === tab.id
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{tab.label}</span>
                          </button>
                        )
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-1/4 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
              <nav className="space-y-1 p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-colors ${
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