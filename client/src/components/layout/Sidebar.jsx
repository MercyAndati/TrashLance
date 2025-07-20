"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Home,
  User,
  Calendar,
  FileText,
  MessageCircle,
  Trophy,
  Settings,
  LogOut,
  X,
  ChevronDown,
  Shield,
  Users,
  BarChart3,
  Plus,
  CreditCard,
  MapPin,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"

const Sidebar = ({ isOpen, onClose }) => {
  const [expandedMenus, setExpandedMenus] = useState({})
  const { user, logout } = useAuth()
  const location = useLocation()

  const toggleMenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }))
  }

  const isActive = (path) => location.pathname === path

  const customerMenuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Calendar, label: "Bookings", path: "/bookings" },
    { icon: FileText, label: "Reports", path: "/posts" },
    { icon: MapPin, label: "Locations", path: "/locations" },
    { icon: MessageCircle, label: "Messages", path: "/chat" },
    { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  const collectorMenuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Calendar, label: "Bookings", path: "/bookings" },
    {
      icon: FileText,
      label: "Services",
      path: "/services",
      submenu: [
        { label: "My Services", path: "/services" },
        { label: "Add Services", path: "/services/add" },
      ],
    },
    { icon: FileText, label: "Reports", path: "/posts" },
    { icon: MapPin, label: "Locations", path: "/locations" },
    { icon: CreditCard, label: "Subscription", path: "/subscription" },
    { icon: MessageCircle, label: "Messages", path: "/chat" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  const adminMenuItems = [
    { icon: Home, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: Calendar, label: "Bookings", path: "/admin/bookings" },
    { icon: FileText, label: "Posts", path: "/admin/posts" },
    { icon: MapPin, label: "Locations", path: "/locations" },
    { icon: Shield, label: "Moderation", path: "/admin/moderation" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
    { icon: Shield, label: "Create Government Account", path: "/admin/create-government" },
  ]

  const governmentMenuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Reports", path: "/posts" },
    { icon: MapPin, label: "Locations", path: "/locations" },
    { icon: Plus, label: "Create Post", path: "/create-post" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  const getMenuItems = () => {
    switch (user?.role) {
      case "service_provider":
        return collectorMenuItems
      case "admin":
        return adminMenuItems
      case "government":
        return governmentMenuItems
      default:
        return customerMenuItems
    }
  }

  const menuItems = getMenuItems()

  return (
    <>
      {/* Mobile overlay */}
      {/*isOpen && <div className="fixed inset-0 bg-black bg-opacity-10 z-40 lg:hidden" onClick={onClose} />*/}

      {/* Sidebar */}
      <div
        className={`
      fixed top-0 left-0 h-full w-48 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 z-50
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0 lg:static lg:z-auto
      border-r border-gray-200 dark:border-gray-700
    `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Trashlance</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img src={user.avatar || "/TrashLance.png"} alt={user.username} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive(item.path)
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedMenus[item.label] ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expandedMenus[item.label] && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          onClick={onClose}
                          className={`
                          block px-3 py-2 rounded-lg text-sm transition-colors
                          ${
                            isActive(subItem.path)
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }
                        `}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive(item.path)
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
