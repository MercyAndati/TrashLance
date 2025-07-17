"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"
import { useAuth } from "./AuthContext"

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
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

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
    </NotificationContext.Provider>
  )
}
