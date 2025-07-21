"use client"

import { useState, useEffect } from "react"
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Star, 
  Users, 
  Clock,
  BarChart3,
  Activity,
  Target,
  Award
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"

const Analytics = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [recentBookings, setRecentBookings] = useState([])
  const [earningsData, setEarningsData] = useState([])
  const [timeframe, setTimeframe] = useState("month")

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeframe])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Fetch user stats
      const statsResponse = await api.get("/users/stats")
      setStats(statsResponse.data.data)

      // Fetch recent bookings for analytics
      const bookingsResponse = await api.get("/bookings?limit=10")
      setRecentBookings(bookingsResponse.data.data.docs || [])

      // Generate real earnings data from bookings
      const realEarningsData = generateRealEarningsData(timeframe, bookingsResponse.data.data.docs || [])
      setEarningsData(realEarningsData)
    } catch (error) {
      console.error("Failed to fetch analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateRealEarningsData = (period, bookings) => {
    const data = []
    const now = new Date()
    
    // Filter completed bookings
    const completedBookings = bookings.filter(booking => booking.status === 'completed')
    
    if (period === "week") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayBookings = completedBookings.filter(booking => 
          new Date(booking.scheduledDate).toISOString().split('T')[0] === dateStr
        )
        
        const earnings = dayBookings.reduce((sum, booking) => sum + (booking.pricing?.totalAmount || 0), 0)
        
        data.push({
          date: dateStr,
          earnings: earnings,
          bookings: dayBookings.length
        })
      }
    } else if (period === "month") {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayBookings = completedBookings.filter(booking => 
          new Date(booking.scheduledDate).toISOString().split('T')[0] === dateStr
        )
        
        const earnings = dayBookings.reduce((sum, booking) => sum + (booking.pricing?.totalAmount || 0), 0)
        
        data.push({
          date: dateStr,
          earnings: earnings,
          bookings: dayBookings.length
        })
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now)
        date.setMonth(date.getMonth() - i)
        const monthStr = date.toISOString().slice(0, 7)
        
        const monthBookings = completedBookings.filter(booking => 
          new Date(booking.scheduledDate).toISOString().slice(0, 7) === monthStr
        )
        
        const earnings = monthBookings.reduce((sum, booking) => sum + (booking.pricing?.totalAmount || 0), 0)
        
        data.push({
          date: monthStr,
          earnings: earnings,
          bookings: monthBookings.length
        })
      }
    }
    
    return data
  }

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 100
    return ((current - previous) / previous * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Track your performance and earnings over time
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 sm:space-x-2">
            <button
              onClick={() => setTimeframe("week")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                timeframe === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                timeframe === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeframe("year")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Total Earnings</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  ${stats.monthlyEarnings || 0}
                </p>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 truncate">
                  +{calculateGrowth(stats.monthlyEarnings || 0, (stats.monthlyEarnings || 0) * 0.8)}% from last {timeframe}
                </p>
              </div>
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Total Bookings</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.bookings || 0}
                </p>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 truncate">
                  +{calculateGrowth(stats.bookings || 0, (stats.bookings || 0) * 0.9)}% from last {timeframe}
                </p>
              </div>
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Average Rating</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.rating?.toFixed(1) || "New"}
                </p>
                <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 truncate">
                  {stats.rating ? "Excellent" : "No ratings yet"}
                </p>
              </div>
              <Star className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Active Services</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.services || 0}
                </p>
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 truncate">
                  Available for booking
                </p>
              </div>
              <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Earnings Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Earnings Trend
            </h3>
            <div className="space-y-3">
              {earningsData.slice(-7).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px] sm:max-w-none">
                    {timeframe === "year" ? item.date : new Date(item.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2 sm:space-x-4 flex-1 justify-end">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      ${item.earnings}
                    </span>
                    <div className="w-16 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 flex-shrink-0">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(item.earnings / Math.max(...earningsData.map(d => d.earnings))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bookings Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Bookings Trend
            </h3>
            <div className="space-y-3">
              {earningsData.slice(-7).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px] sm:max-w-none">
                    {timeframe === "year" ? item.date : new Date(item.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2 sm:space-x-4 flex-1 justify-end">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {item.bookings}
                    </span>
                    <div className="w-16 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 flex-shrink-0">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.bookings / Math.max(...earningsData.map(d => d.bookings))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Performance Goals</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Target</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">KSh 2,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Progress</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {Math.round(((stats.monthlyEarnings || 0) / 1000) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(((stats.monthlyEarnings || 0) / 1000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Achievements</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.bookings >= 10 ? "✓" : "○"} 10+ Bookings
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.rating >= 4.5 ? "✓" : "○"} 4.5+ Rating
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {(stats.monthlyEarnings || 0) >= 1000 ? "✓" : "○"} KSh 1,000+ Earnings
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Booking Value</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${stats.bookings > 0 ? Math.round((stats.monthlyEarnings || 0) / stats.bookings) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">2.3 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">98%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Bookings</h3>
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent bookings</p>
            ) : (
              recentBookings.slice(0, 5).map((booking) => (
                <div key={booking._id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        Booking #{booking.bookingNumber}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                      ${booking.pricing?.totalAmount || 0}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === "completed" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : booking.status === "in_progress"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics