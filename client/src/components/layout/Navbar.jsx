"use client"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, Search, Bell, User, Settings, LogOut, Sun, Moon } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNotifications } from "../../contexts/NotificationContext"
import SubscriptionBanner from './SubscriptionBanner'
import api from "../../services/api"

const Navbar = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [allLocations, setAllLocations] = useState([])
  const [filteredLocations, setFilteredLocations] = useState([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [searchError, setSearchError] = useState("")
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead } = useNotifications()

  useEffect(() => {
    // Fetch all locations on mount
    api.get("/users/locations").then(res => {
      setAllLocations(res.data.data || [])
      setFilteredLocations(res.data.data || [])
    })
  }, [])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    setSearchError("")
    
    if (!value) {
      setFilteredLocations(allLocations)
      setShowLocationDropdown(false)
      return
    }

    const filtered = allLocations.filter(loc => loc.toLowerCase().includes(value.toLowerCase()))
    setFilteredLocations(filtered)
    setShowLocationDropdown(true)
  }

  const handleLocationSelect = (location) => {
    setSearchQuery(location)
    setShowLocationDropdown(false)
    setSearchError("")
    navigate(`/locations?selected=${encodeURIComponent(location)}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    const found = allLocations.find(loc => loc.toLowerCase() === searchQuery.trim().toLowerCase())
    if (found) {
      navigate(`/locations?selected=${encodeURIComponent(found)}`)
    } else {
      setSearchError("Location not available. See available locations below.")
      navigate(`/locations?notfound=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <>
      <SubscriptionBanner />
      <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {user && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Trashlance</span>
            </Link>
          </div>

          {/* Center - Search */}
          {user && (
            <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 150)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Search by location..."
                  />
                  {showLocationDropdown && filteredLocations.length > 0 && (
                    <ul className="absolute z-10 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mt-1 max-h-56 overflow-y-auto shadow-lg">
                      {filteredLocations.map((loc, idx) => (
                        <li
                          key={idx}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          onMouseDown={() => handleLocationSelect(loc)}
                        >
                          {loc}
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchError && (
                    <div className="absolute left-0 right-0 mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-lg px-3 py-2 text-sm">
                      {searchError}
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                              }`}
                              onClick={() => {
                                if (notification.type === 'chat_message' && notification.data?.chatId) {
                                  navigate(`/chat?chatId=${notification.data.chatId}`);
                                  markAsRead(notification._id);
                                  setShowNotifications(false);
                                } else {
                                  markAsRead(notification._id);
                                }
                              }}
                            >
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{notification.message}</p>
                              <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 5 && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                          <Link
                            to="/notifications"
                            className="text-green-600 dark:text-green-400 text-sm hover:underline"
                            onClick={() => setShowNotifications(false)}
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar || "/TrashLance.png"}
                        alt={user.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span className="hidden sm:block text-sm font-medium">{user.username}</span>
                  </button>
                  
                  {/* User dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      {user && (
        <div className="md:hidden px-4 pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search by location..."
              />
            </div>
          </form>
        </div>
      )}

      {/* Click outside handlers */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </nav>
    </>
  )
}

export default Navbar