"use client"

import { useState, useEffect } from "react"
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  MapPin,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Crown,
  Star,
  UserCheck
} from "lucide-react"
import api from "../../services/api"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [recentActivity, setRecentActivity] = useState([])
  const [userGrowth, setUserGrowth] = useState([])
  const [timeframe, setTimeframe] = useState("month")
  const [subscriptionRevenue, setSubscriptionRevenue] = useState({})
  const [platformPerformance, setPlatformPerformance] = useState({})

  useEffect(() => {
    fetchAdminAnalytics()
  }, [timeframe])

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true)

      // Fetch real data from backend
      const response = await api.get(`/admin/analytics?timeframe=${timeframe}`)
      const analytics = response.data.data

      setStats(analytics.stats)
      setRecentActivity(analytics.recentActivity || [])
      setUserGrowth(analytics.timeSeries || [])
      setSubscriptionRevenue(analytics.subscriptionRevenue || {})
      setPlatformPerformance(analytics.platformPerformance || {})
    } catch (error) {
      console.error("Failed to fetch admin analytics:", error)
    } finally {
      setLoading(false)
    }
  }



  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 100
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const handleExport = async (format = 'json') => {
    try {
      const response = await api.get(`/admin/analytics/export?timeframe=${timeframe}&format=${format}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export analytics:', error)
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Monitor platform performance and user engagement
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={() => handleExport('json')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeframe("week")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeframe("year")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  +{stats.growth?.users || 0}% from last {timeframe}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBookings?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  +{stats.growth?.bookings || 0}% from last {timeframe}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Platform Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalRevenue?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  +{stats.growth?.revenue || 0}% from last {timeframe}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Reports</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingReports || 0}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {stats.pendingReports > 10 ? "High" : "Normal"} priority
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Your Revenue Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Revenue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    KSh {subscriptionRevenue.monthlyRevenue?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    +{subscriptionRevenue.revenueGrowth || 0}% from last month
                  </p>
                </div>
                <Crown className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Annual Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    KSh {subscriptionRevenue.annualRevenue?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Projected yearly income
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Premium Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {subscriptionRevenue.premiumUsers || 0}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    KSh {subscriptionRevenue.premiumRevenue?.toLocaleString() || 0} revenue
                  </p>
                </div>
                <Star className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Standard Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {subscriptionRevenue.standardUsers || 0}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    KSh {subscriptionRevenue.standardRevenue?.toLocaleString() || 0} revenue
                  </p>
                </div>
                <UserCheck className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Performance Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Platform Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Provider Earnings</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    KSh {platformPerformance.totalEarnings?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    +{platformPerformance.platformGrowth || 0}% from last month
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Providers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {platformPerformance.activeProviders || 0}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Service providers with verified status
                  </p>
                </div>
                <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Top Earner</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {platformPerformance.topEarners?.[0]?.providerName || 'N/A'}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    KSh {platformPerformance.topEarners?.[0]?.totalEarnings?.toLocaleString() || 0}
                  </p>
                </div>
                <Star className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.activeUsers?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Verified Providers</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {stats.verifiedProviders || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Providers</span>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  {stats.pendingProviders || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${((stats.activeUsers || 0) / (stats.totalUsers || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  KSh {stats.monthlyRevenue?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Booking Value</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  KSh {stats.totalBookings > 0 ? Math.round((stats.totalRevenue || 0) / stats.totalBookings) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {((stats.totalBookings || 0) / (stats.totalUsers || 1) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Status</span>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                </div>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">2.3s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              User Growth
            </h3>
            <div className="space-y-3">
              {userGrowth.slice(-7).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {timeframe === "year" ? item.date : new Date(item.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.users}
                    </span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.users / Math.max(...userGrowth.map(d => d.users))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue Trend
            </h3>
            <div className="space-y-3">
              {userGrowth.slice(-7).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {timeframe === "year" ? item.date : new Date(item.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      KSh {item.revenue}
                    </span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(item.revenue / Math.max(...userGrowth.map(d => d.revenue))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Platform Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {activity.type === "user_registered" && (
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                  {activity.type === "booking_created" && (
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  {activity.type === "report_submitted" && (
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  {activity.type === "provider_verified" && (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  {activity.type === "payment_processed" && (
                    <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.type === "user_registered" && `New user registered: ${activity.user}`}
                      {activity.type === "booking_created" && `New booking: ${activity.booking}`}
                      {activity.type === "report_submitted" && `Report submitted: ${activity.post}`}
                      {activity.type === "provider_verified" && `Provider verified: ${activity.provider}`}
                      {activity.type === "payment_processed" && `Payment processed: ${activity.amount}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.type === "user_registered" 
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : activity.type === "booking_created"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : activity.type === "report_submitted"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    : activity.type === "provider_verified"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }`}>
                  {activity.type.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics 