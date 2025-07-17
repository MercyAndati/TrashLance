"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  MessageCircle,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"

const BookingDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchBookingDetails()
  }, [id])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/bookings/${id}`)
      setBooking(response.data.data)
    } catch (error) {
      console.error("Failed to fetch booking details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      setActionLoading(true)
      const response = await api.put(`/bookings/${id}/status`, { status: newStatus })
      setBooking(response.data.data)
    } catch (error) {
      console.error("Failed to update booking status:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The booking you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Booking Details</h1>
            <p className="text-gray-600 dark:text-gray-400">#{booking._id.slice(-8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Booking Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Service Information</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{booking.service?.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{booking.service?.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {booking.timeSlot?.start} - {booking.timeSlot?.end}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {booking.location?.address?.street}, {booking.location?.address?.city},{" "}
                      {booking.location?.address?.state} {booking.location?.address?.zipCode}
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Special Instructions</p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            {booking.pricing && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pricing Details</h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Price</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${booking.pricing.baseAmount || 0}
                    </span>
                  </div>

                  {booking.pricing.additionalCharges?.map((charge, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{charge.description}</span>
                      <span className="font-medium text-gray-900 dark:text-white">${charge.amount}</span>
                    </div>
                  ))}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${booking.pricing.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Images */}
            {booking.images && booking.images.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {booking.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url || "/placeholder.svg"}
                      alt={`Booking image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {user.role === "customer" ? "Service Provider" : "Customer"}
              </h2>

              {(() => {
                const contactPerson = user.role === "customer" ? booking.serviceProvider : booking.customer
                return (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={contactPerson?.avatar || "/placeholder.svg"}
                        alt={contactPerson?.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{contactPerson?.username}</p>
                        {user.role === "customer" && contactPerson?.serviceProvider?.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {contactPerson.serviceProvider.rating.average?.toFixed(1)} (
                              {contactPerson.serviceProvider.rating.count} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{contactPerson?.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{contactPerson?.email}</span>
                      </div>
                    </div>

                    <button className="w-full btn-primary">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* Actions */}
            {user.role === "service_provider" && booking.status === "pending" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusUpdate("confirmed")}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Accept Booking
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline Booking
                  </button>
                </div>
              </div>
            )}

            {user.role === "service_provider" && booking.status === "confirmed" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Update Status</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Start Service
                  </button>
                </div>
              </div>
            )}

            {user.role === "service_provider" && booking.status === "in_progress" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complete Service</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </button>
                </div>
              </div>
            )}

            {booking.status === "completed" && user.role === "customer" && !booking.review && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leave a Review</h2>
                <button className="w-full btn-primary">
                  <Star className="w-4 h-4 mr-2" />
                  Write Review
                </button>
              </div>
            )}

            {booking.status === "cancelled" && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-400 font-medium">Booking Cancelled</span>
                </div>
                {booking.cancellationReason && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">{booking.cancellationReason}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingDetails
