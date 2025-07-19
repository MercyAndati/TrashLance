"use client"

import { useState, useEffect } from "react"
import { Users, Calendar, FileText, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import api from "../../services/api"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const AdminDashboard = () => {
  const [stats, setStats] = useState({})
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [statsResponse, activityResponse] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/recent-activity"),
      ])

      setStats(statsResponse.data.data)
      setRecentActivity(activityResponse.data.data || [])
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor and manage the Trashlance platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers || 0}</p>
                <p className="text-sm text-green-600 dark:text-green-400">+12% from last month</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeBookings || 0}</p>
                <p className="text-sm text-green-600 dark:text-green-400">+8% from last week</p>
              </div>
              <Calendar className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalReports || 0}</p>
                <p className="text-sm text-red-600 dark:text-red-400">+15% from last month</p>
              </div>
              <FileText className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Platform Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.totalRevenue || 0}</p>
                <p className="text-sm text-green-600 dark:text-green-400">+22% from last month</p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === "user_registered" && (
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        {activity.type === "booking_created" && (
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        {activity.type === "report_submitted" && (
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Health</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-gray-900 dark:text-white">API Status</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Operational</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-gray-900 dark:text-white">Database</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Healthy</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-gray-900 dark:text-white">Background Jobs</span>
                  </div>
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">Processing</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-gray-900 dark:text-white">File Storage</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
              <h3 className="font-medium text-blue-900 dark:text-blue-300">Manage Users</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">View and manage user accounts</p>
            </button>

            <button className="p-4 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" />
              <h3 className="font-medium text-red-900 dark:text-red-300">Review Reports</h3>
              <p className="text-sm text-red-700 dark:text-red-400">Check pending moderation items</p>
            </button>

            <button className="p-4 text-left bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <h3 className="font-medium text-green-900 dark:text-green-300">View Analytics</h3>
              <p className="text-sm text-green-700 dark:text-green-400">Platform performance metrics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
