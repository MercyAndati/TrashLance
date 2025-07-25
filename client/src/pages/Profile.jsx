"use client"
import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Mail, Phone, MapPin, Star, Calendar, Package, Edit3, Camera, Shield, Award, Clock } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"

const Profile = () => {
  const { id } = useParams()
  const { user: currentUser, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [uploading, setUploading] = useState(false)

  const isOwnProfile = !id || id === currentUser?._id
  const profileUser = isOwnProfile ? currentUser : profile

  useEffect(() => {
    if (isOwnProfile) {
      console.log("Current user data:", currentUser)
      setProfile(currentUser)
      setLoading(false)
    } else {
      fetchProfile()
    }
  }, [id, currentUser])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/users/${id}`)
      setProfile(response.data.data)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (editing) {
      setEditForm({})
    } else {
      setEditForm({
        username: profileUser.username,
        email: profileUser.email,
        phone: profileUser.phone,
        address: profileUser.address || {},
        serviceProvider: profileUser.serviceProvider || {},
      })
    }
    setEditing(!editing)
  }

  const handleSaveProfile = async () => {
    try {
      const response = await api.put("/users/profile", editForm)
      console.log("Profile update response:", response.data.data)
      updateUser(response.data.data)
      setProfile(response.data.data)
      setEditing(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      setUploading(true)
      const response = await api.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const updatedUser = { ...profileUser, avatar: response.data.data.avatar }
      updateUser(updatedUser)
      setProfile(updatedUser)
    } catch (error) {
      console.error("Failed to upload avatar:", error)
    } finally {
      setUploading(false)
    }
  }

  // New function to handle review deletion
  const handleDeleteReview = async (reviewId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this review?")) {
        return
      }

      await api.delete(`/users/${profileUser._id}/rate/${reviewId}`)
      console.log("Review deleted successfully!")

      // After deletion, refresh the profile data to update the UI
      if (isOwnProfile) {
        updateUser() // If it's the current user's profile, update the global user state
      } else {
        fetchProfile() // If viewing another user's profile, refetch their data
      }
    } catch (error) {
      console.error("Failed to delete review:", error)
      alert("Failed to delete review. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 h-32"></div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
              {/* Avatar */}
              <div className="relative -mt-16 mb-4 sm:mb-0">
                <div className="relative">
                  <img
                    src={profileUser.avatar || "/TrashLance.png"}
                    alt={profileUser.username}
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800"
                  />
                  {isOwnProfile && (
                    <label className="absolute bottom-2 right-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
              </div>
              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileUser.username}</h1>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">
                      {profileUser.role?.replace("_", " ")}
                      {profileUser.serviceProvider?.isVerified && (
                        <Shield className="inline w-4 h-4 ml-2 text-green-600 dark:text-green-400" />
                      )}
                    </p>
                    {profileUser.role === "service_provider" && profileUser.serviceProvider?.rating && (
                      <div className="flex items-center mt-2">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {profileUser.serviceProvider.rating.average?.toFixed(1)}(
                          {profileUser.serviceProvider.rating.count} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  {isOwnProfile && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleEditToggle}
                        className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        {editing ? "Cancel" : "Edit Profile"}
                      </button>
                      {profileUser.role === "service_provider" && (
                        <Link
                          to="/manage-locations"
                          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Manage Locations
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* In the profile header, after the edit/manage buttons, add contact actions for customers viewing a collector */}
          {!isOwnProfile && profileUser.role === "service_provider" && (
            <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0 px-6 pb-4">
              <button
                className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                onClick={() => (window.location.href = `/chat?user=${profileUser._id}`)}
              >
                Send Message
              </button>
              <button
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                onClick={() => (window.location.href = `/bookings/create?provider=${profileUser._id}`)}
              >
                Book Service
              </button>
            </div>
          )}
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      value={editForm.username || ""}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ""}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button onClick={handleSaveProfile} className="btn-primary">
                      Save Changes
                    </button>
                    <button onClick={handleEditToggle} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{profileUser.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{profileUser.phone}</span>
                  </div>
                  {profileUser.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {[profileUser.address.city, profileUser.address.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Service Provider Details */}
            {profileUser.role === "service_provider" && profileUser.serviceProvider && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Provider Details</h2>
                <div className="space-y-4">
                  {profileUser.serviceProvider.companyName && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Company Name</h3>
                      <p className="text-gray-600 dark:text-gray-400">{profileUser.serviceProvider.companyName}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Working Hours</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {profileUser.serviceProvider.workingHours &&
                        Object.entries(profileUser.serviceProvider.workingHours).map(([day, hours]) => (
                          <div key={day} className="text-sm">
                            <span className="capitalize font-medium text-gray-900 dark:text-white">{day}:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {hours.available ? `${hours.start} - ${hours.end}` : "Closed"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Service Radius</h3>
                    {editing ? (
                      <div className="mt-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={
                            editForm.serviceProvider?.serviceRadius || profileUser.serviceProvider.serviceRadius || 10
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              serviceProvider: {
                                ...editForm.serviceProvider,
                                serviceRadius: Number.parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          How far are you willing to travel (in kilometers)
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        {profileUser.serviceProvider.serviceRadius || 10} km
                      </p>
                    )}
                  </div>
                  {profileUser.serviceProvider.serviceLocations && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Service Locations</h3>
                      {editing ? (
                        <div className="mt-2">
                          <textarea
                            value={
                              editForm.serviceProvider?.serviceLocations ||
                              profileUser.serviceProvider.serviceLocations ||
                              ""
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                serviceProvider: {
                                  ...editForm.serviceProvider,
                                  serviceLocations: e.target.value,
                                },
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter locations separated by commas (e.g., Nairobi, Mombasa, Kisumu)"
                            rows={3}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Separate multiple locations with commas
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profileUser.serviceProvider.serviceLocations.split(",").map((location, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              {location.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {profileUser.serviceProvider.subscription && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Subscription Plan</h3>
                      {console.log("Profile subscription data:", profileUser.serviceProvider.subscription)}
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          profileUser.serviceProvider.subscription.plan === "Premium"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            : profileUser.serviceProvider.subscription.plan === "Standard"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        {profileUser.serviceProvider.subscription.plan}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Reviews Section for Customers - positioned below service provider details */}
            {profileUser.role === "service_provider" &&
              profileUser.ratings &&
              profileUser.ratings.length > 0 &&
              profileUser.role === "service_provider" &&
              !isOwnProfile && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reviews</h2>
                  <div className="space-y-4">
                    {profileUser.ratings.map(
                      (
                        rating, // Removed idx, using rating._id for key
                      ) => (
                        <div key={rating._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xl ${rating.star >= star ? "text-yellow-400" : "text-gray-300"}`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 text-gray-700 dark:text-gray-200 font-medium">{rating.star} / 5</span>
                          </div>
                          <div className="mb-2 text-gray-700 dark:text-gray-200">{rating.comment}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            By {rating.citizenId?.username || "User"} on{" "}
                            {rating.ratedAt ? new Date(rating.ratedAt).toLocaleDateString() : ""}
                          </div>
                          {currentUser && rating.citizenId && rating.citizenId.toString() === currentUser._id && (
                            <div className="flex space-x-2 mt-2">
                              <button
                                className="btn-secondary"
                                onClick={() => {
                                  /* trigger edit in BookingDetails or modal */
                                }}
                              >
                                Edit
                              </button>
                              <button className="btn-danger" onClick={() => handleDeleteReview(rating._id)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
          {/* Sidebar */}
          {!(profileUser.role === "service_provider" && !isOwnProfile) && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Points</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{profileUser.points || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(profileUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {profileUser.role === "service_provider" && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Services</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {profileUser.serviceProvider?.servicesOffered?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Active</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {profileUser.lastLogin ? new Date(profileUser.lastLogin).toLocaleDateString() : "Never"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Reviews Section for Service Providers - positioned below stats in sidebar */}
              {profileUser.role === "service_provider" && profileUser.ratings && profileUser.ratings.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reviews</h2>
                  <div className="space-y-4">
                    {profileUser.ratings.map(
                      (
                        rating, // Removed idx, using rating._id for key
                      ) => (
                        <div key={rating._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xl ${rating.star >= star ? "text-yellow-400" : "text-gray-300"}`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 text-gray-700 dark:text-gray-200 font-medium">{rating.star} / 5</span>
                          </div>
                          <div className="mb-2 text-gray-700 dark:text-gray-200">{rating.comment}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            By {rating.citizenId?.username || "User"} on{" "}
                            {rating.ratedAt ? new Date(rating.ratedAt).toLocaleDateString() : ""}
                          </div>
                          {currentUser && rating.citizenId && rating.citizenId.toString() === currentUser._id && (
                            <div className="flex space-x-2 mt-2">
                              <button className="btn-danger" onClick={() => handleDeleteReview(rating._id)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
