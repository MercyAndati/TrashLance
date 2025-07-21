"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Award, TrendingUp, Star, Filter, X } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"

const Leaderboard = () => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [timeframe, setTimeframe] = useState("all")
  const [category, setCategory] = useState("points")
  const [role, setRole] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe, category, role])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const roleParam = role !== "all" ? `&role=${role}` : ""
      const response = await api.get(`/users/leaderboard?timeframe=${timeframe}&category=${category}${roleParam}`)
      setLeaderboard(response.data.data.leaderboard || [])
      setUserRank(response.data.data.userRank)
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
      default:
        return <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-gray-500 font-bold text-sm">#{rank}</span>
    }
  }

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">Community Leaderboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
            See how you rank among other community members making a difference
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="sm:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-700 dark:text-gray-300"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters */}
        <div className={`${showFilters ? 'block' : 'hidden'} sm:block bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8`}>
          {/* Mobile Filter Header */}
          <div className="sm:hidden flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="points">Points</option>
                  <option value="reports">Reports Made</option>
                  <option value="bookings">Services Booked</option>
                  {user.role === "service_provider" && <option value="earnings">Earnings</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="all">All</option>
                  <option value="customer">Customer</option>
                  <option value="service_provider">Service Provider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
              </div>
            </div>

            {userRank && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4 sm:ml-4 sm:min-w-[200px]">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300 font-medium text-sm sm:text-base">
                    Your Rank: #{userRank.position}
                  </span>
                </div>
                <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm mt-1">
                  {category === "points" && `${userRank.points} points`}
                  {category === "reports" && `${userRank.reports} reports`}
                  {category === "bookings" && `${userRank.bookings} bookings`}
                  {category === "earnings" && `KSh ${userRank.earnings}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top 3 - Mobile Optimized */}
        {leaderboard.length >= 3 && (
          <div className="mb-6 sm:mb-8">
            {/* Mobile: Vertical Stack */}
            <div className="sm:hidden space-y-4">
              {/* 1st Place */}
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg p-4 text-center text-white">
                <div className="flex items-center justify-center space-x-4">
                  <div className="relative">
                    <img
                      src={leaderboard[0]?.avatar || "/TrashLance.png"}
                      alt={leaderboard[0]?.username}
                      className="w-16 h-16 rounded-full border-2 border-white object-cover"
                    />
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <Trophy className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold">{leaderboard[0]?.username}</h3>
                    <p className="text-yellow-100 text-sm">{leaderboard[0]?.role?.replace("_", " ")}</p>
                    <div className="text-xl font-bold mt-1">
                      {category === "points" && `${leaderboard[0]?.points || 0} pts`}
                      {category === "reports" && `${leaderboard[0]?.reports || 0}`}
                      {category === "bookings" && `${leaderboard[0]?.bookings || 0}`}
                      {category === "earnings" && `KSh ${leaderboard[0]?.earnings || 0}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2nd and 3rd Place */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 text-center">
                  <div className="relative mb-2">
                    <img
                      src={leaderboard[1]?.avatar || "/TrashLance.png"}
                      alt={leaderboard[1]?.username}
                      className="w-12 h-12 rounded-full mx-auto border-2 border-gray-300 object-cover"
                    />
                    <div className="absolute -top-1 -right-1 bg-gray-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{leaderboard[1]?.username}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {leaderboard[1]?.role?.replace("_", " ")}
                  </p>
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">
                    {category === "points" && `${leaderboard[1]?.points || 0}`}
                    {category === "reports" && `${leaderboard[1]?.reports || 0}`}
                    {category === "bookings" && `${leaderboard[1]?.bookings || 0}`}
                    {category === "earnings" && `${leaderboard[1]?.earnings || 0}`}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 text-center">
                  <div className="relative mb-2">
                    <img
                      src={leaderboard[2]?.avatar || "/TrashLance.png"}
                      alt={leaderboard[2]?.username}
                      className="w-12 h-12 rounded-full mx-auto border-2 border-amber-300 object-cover"
                    />
                    <div className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{leaderboard[2]?.username}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {leaderboard[2]?.role?.replace("_", " ")}
                  </p>
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">
                    {category === "points" && `${leaderboard[2]?.points || 0}`}
                    {category === "reports" && `${leaderboard[2]?.reports || 0}`}
                    {category === "bookings" && `${leaderboard[2]?.bookings || 0}`}
                    {category === "earnings" && `${leaderboard[2]?.earnings || 0}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Original Grid */}
            <div className="hidden sm:grid grid-cols-3 gap-6">
              {/* 2nd Place */}
              <div className="order-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="relative mb-4">
                    <img
                      src={leaderboard[1]?.avatar || "/TrashLance.png"}
                      alt={leaderboard[1]?.username}
                      className="w-20 h-20 rounded-full mx-auto border-4 border-gray-300 object-cover"
                    />
                    <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      2
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{leaderboard[1]?.username}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {leaderboard[1]?.role?.replace("_", " ")}
                  </p>
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {category === "points" && `${leaderboard[1]?.points || 0} pts`}
                    {category === "reports" && `${leaderboard[1]?.reports || 0}`}
                    {category === "bookings" && `${leaderboard[1]?.bookings || 0}`}
                    {category === "earnings" && `KSh ${leaderboard[1]?.earnings || 0}`}
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-2">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg p-6 text-center text-white transform scale-105">
                  <div className="relative mb-4">
                    <img
                      src={leaderboard[0]?.avatar || "/TrashLance.png"}
                      alt={leaderboard[0]?.username}
                      className="w-24 h-24 rounded-full mx-auto border-4 border-white object-cover"
                    />
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{leaderboard[0]?.username}</h3>
                  <p className="text-yellow-100 text-sm mb-2">{leaderboard[0]?.role?.replace("_", " ")}</p>
                  <div className="text-3xl font-bold">
                    {category === "points" && `${leaderboard[0]?.points || 0} pts`}
                    {category === "reports" && `${leaderboard[0]?.reports || 0}`}
                    {category === "bookings" && `${leaderboard[0]?.bookings || 0}`}
                    {category === "earnings" && `KSh ${leaderboard[0]?.earnings || 0}`}
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="relative mb-4">
                    <img
                      src={leaderboard[2]?.avatar || "/TrashLance.png"}
                      alt={leaderboard[2]?.username}
                      className="w-20 h-20 rounded-full mx-auto border-4 border-amber-300 object-cover"
                    />
                    <div className="absolute -top-2 -right-2 bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      3
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{leaderboard[2]?.username}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {leaderboard[2]?.role?.replace("_", " ")}
                  </p>
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {category === "points" && `${leaderboard[2]?.points || 0} pts`}
                    {category === "reports" && `${leaderboard[2]?.reports || 0}`}
                    {category === "bookings" && `${leaderboard[2]?.bookings || 0}`}
                    {category === "earnings" && `KSh ${leaderboard[2]?.earnings || 0}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Full Rankings</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboard.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No rankings yet</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Start participating to see rankings!</p>
              </div>
            ) : (
              leaderboard.map((member, index) => (
                <div
                  key={member._id}
                  className={`p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    member._id === user._id ? "bg-green-50 dark:bg-green-900/20" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-6 sm:w-8 flex-shrink-0">{getRankIcon(index + 1)}</div>
                    <img
                      src={member.avatar || "/TrashLance.png"}
                      alt={member.username}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{member.username}</h3>
                        {member._id === user._id && (
                          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1 rounded-full flex-shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 capitalize truncate">
                        {member.role?.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {category === "points" && `${member.points || 0}`}
                      {category === "reports" && `${member.reports || 0}`}
                      {category === "bookings" && `${member.bookings || 0}`}
                      {category === "earnings" && `${member.earnings || 0}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {category === "points" && "pts"}
                      {category === "earnings" && "KSh"}
                    </div>
                    {member.rating && (
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{member.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Achievement Info */}
        <div className="mt-6 sm:mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">How to Earn Points</h3>
              <ul className="text-blue-800 dark:text-blue-400 text-xs sm:text-sm space-y-1">
                <li>• Report illegal dumping sites: +10 points</li>
                <li>• Book waste collection services: +5 points</li>
                <li>• Complete service bookings: +15 points</li>
                <li>• Receive 5-star reviews: +20 points</li>
                <li>• Refer new users: +25 points</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard