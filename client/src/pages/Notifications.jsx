"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Bell, Filter, Search, Check, Trash2, ArrowLeft } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"

const Notifications = () => {
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, fetchNotifications } = useNotifications()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNotifications, setSelectedNotifications] = useState([])

  useEffect(() => {
    fetchNotifications()
  }, [])

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter = filter === "all" || 
      (filter === "unread" && !notification.isRead) ||
      (filter === "read" && notification.isRead)
    
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification._id)
      }

      // Navigate based on notification type
      if (notification.type === 'chat_message' && notification.data?.chatId) {
        navigate(`/chat?chatId=${notification.data.chatId}`)
      } else if (notification.data?.bookingId) {
        navigate(`/bookings/${notification.data.bookingId}`)
      } else if (notification.data?.postId) {
        navigate(`/posts/${notification.data.postId}`)
      } else if (notification.data?.actionUrl) {
        navigate(notification.data.actionUrl)
      }
    } catch (error) {
      console.error("Failed to handle notification click:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true)
      await api.patch("/notifications/mark-all-read")
      await fetchNotifications()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      await fetchNotifications()
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_rescheduled':
        return "📅"
      case 'service_started':
      case 'service_completed':
        return "✅"
      case 'payment_received':
      case 'payment_failed':
        return "💰"
      case 'chat_message':
      case 'new_chat':
        return "💬"
      case 'new_comment':
        return "💭"
      case 'account_verified':
        return "✅"
      case 'system_maintenance':
        return "🔧"
      case 'promotion':
        return "🎉"
      case 'reminder':
        return "⏰"
      default:
        return "🔔"
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'service_completed':
      case 'payment_received':
      case 'account_verified':
        return "text-green-600"
      case 'booking_cancelled':
      case 'payment_failed':
        return "text-red-600"
      case 'booking_rescheduled':
      case 'service_started':
        return "text-yellow-600"
      case 'chat_message':
      case 'new_chat':
      case 'new_comment':
        return "text-blue-600"
      case 'system_maintenance':
        return "text-orange-600"
      case 'promotion':
        return "text-purple-600"
      case 'reminder':
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60))
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInHours / 24)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4 mr-2" />}
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || filter !== "all" ? "No notifications found" : "No notifications yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || filter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "You'll see notifications here when you receive them"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`text-2xl ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {notification.message}
                          </p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNotification(notification._id)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Notifications 