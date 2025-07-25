"use client"
import { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import socket from "../services/socket" // Import the shared socket instance
import { Bell } from "lucide-react"

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  // const [socket, setSocket] = useState(null) // No longer needed, using shared instance
  const [toast, setToast] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchNotifications()

      // Join user's personal room using the shared socket
      socket.emit("join", user._id)
      console.log("Joining user room:", user._id)

      // Listen for real-time notifications
      socket.on("new-notification", (data) => {
        console.log("Received notification:", data)
        const newNotification = {
          _id: Date.now().toString(), // Temporary ID
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          isRead: false,
          createdAt: new Date().toISOString(),
        }

        addNotification(newNotification)

        // Show toast for new notifications
        setToast({
          title: data.title,
          message: data.message,
          type: data.type,
        })

        // Auto-hide toast after 5 seconds
        setTimeout(() => setToast(null), 5000)
      })

      // Clean up the event listener when the component unmounts or user changes
      return () => {
        socket.off("new-notification")
        // No need to disconnect the shared socket here, as it's managed globally
      }
    }
  }, [user]) // Depend on user to re-run when user logs in/out

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications")
      const notifs = response.data.data
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.isRead).length)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev])
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        addNotification,
      }}
    >
      {children}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{toast.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}
