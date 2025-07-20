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
  DollarSign,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"
import { useMediaQuery } from 'react-responsive';

const BOOKING_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];
const SPECIAL_STATUSES = [
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-600' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'bg-yellow-500' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'partial', label: 'Partially Paid', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
];

const BookingDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const collectorId = booking?.serviceProvider?._id;
  const userReview = booking?.serviceProvider?.ratings?.find(r => r.citizenId === user._id);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(userReview ? userReview.star : 0);
  const [reviewText, setReviewText] = useState(userReview ? userReview.comment : "");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  useEffect(() => {
    fetchBookingDetails()
  }, [id])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/bookings/${id}`)
      setBooking(response.data.data.booking || response.data.data)
    } catch (error) {
      console.error("Failed to fetch booking details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      setActionLoading(true)
      const response = await api.patch(`/bookings/${id}/status`, { status: newStatus })
      const updatedBooking = response.data.data.booking || response.data.data;
      if (updatedBooking && updatedBooking._id) {
        setBooking(updatedBooking);
      }
    } catch (error) {
      console.error("Failed to update booking status:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePaymentStatusUpdate = async (newStatus) => {
    try {
      setPaymentActionLoading(true);
      const response = await api.patch(`/bookings/${id}/payment-status`, { status: newStatus });
      const updatedBooking = response.data.data.booking || response.data.data;
      if (updatedBooking && updatedBooking._id) {
        setBooking(updatedBooking);
      }
    } catch (error) {
      console.error("Failed to update payment status:", error);
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    setReviewLoading(true);
    setReviewError("");
    try {
      await api.post(`/users/${collectorId}/rate`, {
        star: reviewRating,
        comment: reviewText,
      });
      setShowReviewForm(false);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 2000);
      fetchBookingDetails(); // Refresh booking to show review
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };
  const handleDeleteReview = async () => {
    setReviewLoading(true);
    setReviewError("");
    try {
      await api.post(`/users/${collectorId}/rate`, {
        star: 0,
        comment: "",
      });
      setShowReviewForm(false);
      fetchBookingDetails();
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to delete review.");
    } finally {
      setReviewLoading(false);
    }
  };

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

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const currentStatusIndex = booking && booking.status ? BOOKING_STATUSES.findIndex(s => s.value === booking.status) : -1;
  const isSpecialStatus = booking && booking.status ? SPECIAL_STATUSES.some(s => s.value === booking.status) : false;

  const renderStatusStepper = () => {
    if (!booking || !booking.status) return null;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Booking Status</h3>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row items-center justify-between'} w-full`}>
          {BOOKING_STATUSES.map((step, idx) => {
            const isCompleted = idx < currentStatusIndex;
            const isCurrent = idx === currentStatusIndex && !isSpecialStatus;
            const isLastStep = idx === BOOKING_STATUSES.length - 1;
            
            return (
              <div key={step.value} className={`flex ${isMobile ? 'flex-row items-center w-full' : 'flex-col items-center flex-1'}`}>
                <div className={`flex ${isMobile ? 'flex-row' : 'flex-col'} items-center ${isMobile ? 'w-full' : ''}`}>
                  <button
                    disabled={user.role !== 'service_provider' || idx > currentStatusIndex + 1 || isSpecialStatus || idx <= currentStatusIndex}
                    onClick={() => handleStatusUpdate(step.value)}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${isMobile ? 'flex-shrink-0' : ''}
                    ${isCompleted ? 'bg-green-600 border-green-600 text-white' : isCurrent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}
                    ${user.role === 'service_provider' && idx === currentStatusIndex + 1 && !isSpecialStatus ? 'hover:border-blue-600 hover:bg-blue-50 cursor-pointer' : ''}
                  `}
                    title={step.label}
                  >
                    {isCompleted || isCurrent ? <CheckCircle className="w-6 h-6" /> : idx + 1}
                  </button>
                  
                  <span className={`${isMobile ? 'ml-3 flex-1' : 'mt-2'} text-sm ${isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                
                {!isLastStep && (
                  <div className={`${
                    isMobile 
                      ? 'w-1 h-8 ml-5 my-2' // Vertical line for mobile
                      : 'h-1 w-full mx-4'    // Horizontal line for desktop
                  } ${isCompleted ? 'bg-green-600' : 'bg-gray-300'} rounded-full`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Payment Progress Stepper
  const renderPaymentProgress = () => {
    if (!booking || !booking.payment) return null;
    const currentIdx = PAYMENT_STATUSES.findIndex(s => s.value === booking.payment.status);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Payment Status</h3>
          </div>
          
          {/* Payment status update dropdown for service providers */}
          {user.role === 'service_provider' && booking.serviceProvider?._id === user._id && (
            <select
              value={booking.payment.status}
              onChange={e => handlePaymentStatusUpdate(e.target.value)}
              disabled={paymentActionLoading}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {PAYMENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          )}
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row items-center justify-between'} w-full`}>
          {PAYMENT_STATUSES.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isLastStep = idx === PAYMENT_STATUSES.length - 1;
            
            return (
              <div key={step.value} className={`flex ${isMobile ? 'flex-row items-center w-full' : 'flex-col items-center flex-1'}`}>
                <div className={`flex ${isMobile ? 'flex-row' : 'flex-col'} items-center ${isMobile ? 'w-full' : ''}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isMobile ? 'flex-shrink-0' : ''}
                    ${isCompleted ? 'bg-green-600 border-green-600 text-white' : isCurrent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
                  >
                    {isCompleted || isCurrent ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                  </div>
                  
                  <span className={`${isMobile ? 'ml-3 flex-1' : 'mt-2'} text-xs ${isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                
                {!isLastStep && (
                  <div className={`${
                    isMobile 
                      ? 'w-1 h-6 ml-4 my-2' // Vertical line for mobile
                      : 'h-1 w-full mx-4'    // Horizontal line for desktop
                  } ${isCompleted ? 'bg-green-600' : 'bg-gray-300'} rounded-full`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!booking || !booking._id) {
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

        {/* Progress Steppers Section */}
        <div className="space-y-6 mb-8">
          {/* Booking Status Stepper */}
          {renderStatusStepper()}
          
          {/* Payment Progress Stepper */}
          {renderPaymentProgress()}
        </div>

        {/* Service Provider Action Buttons */}
        {user.role === 'service_provider' && !isSpecialStatus && (
          <div className="mb-6">
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300 font-medium">Quick Actions:</div>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleStatusUpdate(s.value)}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-semibold ${s.color} hover:opacity-90 transition-colors`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Special Status Alert */}
        {isSpecialStatus && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${booking.status === 'cancelled' ? 'bg-red-600' : 'bg-yellow-500'}`}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Booking {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
            </div>
            {booking.cancellationReason && (
              <p className="mt-2 text-sm opacity-90">{booking.cancellationReason}</p>
            )}
          </div>
        )}

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
                      src={image.url || "/TrashLance.png"}
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
                        src={contactPerson?.avatar || "/TrashLance.png"}
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

                    {/* Show client location for collector */}
                    {user.role === "service_provider" && booking.location && (
                      <div className="mt-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Client Location</h3>
                        {booking.location.residence && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm">Residence: {booking.location.residence}</p>
                        )}
                        {booking.location.address && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm">Address: {booking.location.address}</p>
                        )}
                      </div>
                    )}
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
          </div>
        </div>
      </div>
      {user.role === "customer" && booking.status === "completed" && (
        <div className="mt-8">
          {reviewSuccess && (
            <div className="mb-4 text-green-600 font-semibold">Review submitted!</div>
          )}
          {userReview && !showReviewForm ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">Your Review</h2>
                <div className="flex items-center mb-2">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={`text-2xl ${userReview.star >= star ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                </div>
                <div className="mb-2 text-gray-700 dark:text-gray-200">{userReview.comment}</div>
              </div>
              <div className="flex flex-col items-end ml-4 space-y-2">
                <button className="text-blue-600 hover:text-blue-800" title="Edit" onClick={() => setShowReviewForm(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3z" /></svg>
                </button>
                <button className="text-red-600 hover:text-red-800" title="Delete" onClick={handleDeleteReview} disabled={reviewLoading}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-4">{userReview ? 'Edit Review' : 'Leave a Review'}</h2>
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="input-field w-full mb-4"
                rows={3}
                placeholder="Write your review..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
              />
              {reviewError && <div className="text-red-600 text-sm mb-2">{reviewError}</div>}
              <div className="flex space-x-2">
                <button
                  className="btn-primary"
                  onClick={handleSubmitReview}
                  disabled={reviewLoading || reviewRating === 0}
                >
                  {reviewLoading ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowReviewForm(false)}
                  disabled={reviewLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {user.role === "customer" && booking.status === "completed" && (
        <div className="mt-4 flex justify-center">
          <button
            className="btn-primary"
            onClick={() => navigate(`/book?provider=${booking.serviceProvider._id}`)}
          >
            Rebook this Collector
          </button>
        </div>
      )}
    </div>
  )
}

export default BookingDetails