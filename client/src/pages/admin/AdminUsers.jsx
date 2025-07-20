"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MoreHorizontal, Ban, CheckCircle } from "lucide-react"
import api from "../../services/api"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [viewMode, setViewMode] = useState("table") // "table" or "grouped"

  useEffect(() => {
    fetchUsers()
  }, [currentPage, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      })

      console.log('Fetching users with params:', params.toString())
      const response = await api.get(`/admin/users?${params}`)
      console.log('Users response:', response.data)
      
      setUsers(response.data.data?.users || [])
      setTotalPages(response.data.data?.totalPages || 1)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId, action) => {
    try {
      setActionLoading(true)
      await api.patch(`/admin/users/${userId}/${action}`)
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      alert(`Failed to ${action} user`)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
            Active
          </span>
        )
      case "suspended":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full text-xs font-medium">
            Suspended
          </span>
        )
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-xs font-medium">
            Pending
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 rounded-full text-xs font-medium">
            Unknown
          </span>
        )
    }
  }

  const getRoleBadge = (role) => {
    const colors = {
      customer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      service_provider: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      government: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    }

    return (
      <span className={`px-2 py-1 ${colors[role] || colors.customer} rounded-full text-xs font-medium`}>
        {role?.replace("_", " ").toUpperCase()}
      </span>
    )
  }

  const groupUsersByRole = () => {
    const grouped = {
      customer: [],
      service_provider: [],
      government: [],
      admin: []
    }
    
    users.forEach(user => {
      if (grouped[user.role]) {
        grouped[user.role].push(user)
      }
    })
    
    return grouped
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage and monitor all platform users</p>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("grouped")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "grouped"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              }`}
            >
              Grouped View
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchUsers()}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search users..."
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="service_provider">Service Provider</option>
              <option value="government">Government</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>

            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Users Table */}
        {viewMode === "table" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={user.avatar || "/TrashLance.png"}
                            alt={user.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {user.status === "active" ? (
                            <button
                              onClick={() => handleUserAction(user._id, "suspend")}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user._id, "activate")}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grouped Users View */}
        {viewMode === "grouped" && (
          <div className="space-y-6">
            {Object.entries(groupUsersByRole()).map(([role, roleUsers]) => (
              <div key={role} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {role.replace("_", " ").toUpperCase()} ({roleUsers.length})
                  </h3>
                  {getRoleBadge(role)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roleUsers.map((user) => (
                    <div key={user._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatar || "/TrashLance.png"}
                          alt={user.username}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{user.username}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(user.status)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.status === "active" ? (
                            <button
                              onClick={() => handleUserAction(user._id, "suspend")}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Suspend User"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user._id, "activate")}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Activate User"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {roleUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No {role.replace("_", " ")} users found
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg font-medium ${
                  currentPage === page
                    ? "bg-green-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
