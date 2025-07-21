"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { MapPin, Calendar, Eye, MessageCircle, ArrowLeft, Clock, CheckCircle, Trash2, X } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"

const PostDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchPostDetails()
  }, [id])

  const fetchPostDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/posts/${id}`)
      console.log("Post details response:", response.data)
      setPost(response.data.data.post)
    } catch (error) {
      console.error("Failed to fetch post details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      setActionLoading(true)
      const response = await api.put(`/posts/${id}/status`, { status: newStatus })
      setPost(response.data.data.post)
    } catch (error) {
      console.error("Failed to update post status:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      setSubmittingComment(true)
      const response = await api.post(`/posts/${id}/comments`, { content: comment })
      setPost((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), response.data.data.comment],
      }))
      setComment("")
    } catch (error) {
      console.error("Failed to submit comment:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`)
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c._id !== commentId),
      }))
    } catch (error) {
      alert("Failed to delete comment.")
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return
    try {
      await api.delete(`/posts/${post._id}`)
      navigate("/posts")
    } catch (error) {
      alert("Failed to delete post.")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "reported":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "critical":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const statusSteps = [
    { value: "reported", label: "Reported" },
    { value: "acknowledged", label: "Acknowledged" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
  ]

  const handleStatusStepClick = async (step) => {
    if (post.status === step) return
    try {
      setActionLoading(true)
      const response = await api.patch(`/posts/${post._id}/status`, { status: step })
      setPost(response.data.data.post)
    } catch (error) {
      alert("Failed to update status.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Post Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The post you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 sm:mr-4 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Report Details</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                #{post && post._id ? post._id.slice(-8) : ""}
              </p>
            </div>
          </div>
          {/* Delete post icon for author or admin */}
          {(user && (user._id === post.author?._id || user.role === "admin")) && (
            <button
              onClick={handleDeletePost}
              className="ml-2 p-2 text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Delete post"
            >
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Post Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                <div className="flex flex-wrap gap-2">
                  {post.status && (
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(post.status)}`}>
                      {post.status.replace("_", " ").toUpperCase()}
                    </span>
                  )}
                  {post.severity && (
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getSeverityColor(post.severity)}`}>
                      {post.severity.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.views || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Status Stepper for admin/government - Mobile Optimized */}
              {(user && ["admin", "government"].includes(user.role)) && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Update Status</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {statusSteps.map((step) => (
                      <button
                        key={step.value}
                        type="button"
                        className={`p-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] ${
                          post.status === step.value
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500"
                        } ${actionLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-500 hover:text-white"}`}
                        disabled={actionLoading}
                        onClick={() => handleStatusStepClick(step.value)}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base leading-relaxed">{post.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base break-words">
                      {post.location?.placeName || "Unknown location"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Reported</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evidence Photos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {post.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-48 sm:h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            // Could implement lightbox/modal here for full screen viewing
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reporter Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center space-x-3">
                  <img
                    src={post.reporter?.avatar || "/placeholder.svg"}
                    alt={post.reporter?.username}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                      Reported by {post.reporter?.username}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Comments ({post.comments?.length || 0})
              </h3>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm sm:text-base"
                  rows="3"
                  placeholder="Add a comment..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    {submittingComment ? <LoadingSpinner size="sm" /> : "Post Comment"}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0"
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={comment.author?.avatar || "/placeholder.svg"}
                          alt={comment.author?.username}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                              {comment.author?.username}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {/* Delete icon for comment author or admin */}
                            {(user && (user._id === comment.author?._id || user.role === "admin")) && (
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="self-start sm:ml-auto p-1 text-red-500 hover:text-red-700 min-h-[32px] min-w-[32px] flex items-center justify-center"
                                title="Delete comment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed break-words">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No comments yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:space-y-8">
            {/* Actions for Government Users */}
            {user.role === "government" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>

                <div className="space-y-3">
                  {post.status === "reported" && (
                    <button
                      onClick={() => handleStatusUpdate("acknowledged")}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg font-medium transition-colors min-h-[44px]"
                    >
                      {actionLoading ? <LoadingSpinner size="sm" /> : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Acknowledge Report
                        </>
                      )}
                    </button>
                  )}

                  {post.status === "acknowledged" && (
                    <button
                      onClick={() => handleStatusUpdate("in_progress")}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors min-h-[44px]"
                    >
                      {actionLoading ? <LoadingSpinner size="sm" /> : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Start Investigation
                        </>
                      )}
                    </button>
                  )}

                  {post.status === "in_progress" && (
                    <button
                      onClick={() => handleStatusUpdate("resolved")}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors min-h-[44px]"
                    >
                      {actionLoading ? <LoadingSpinner size="sm" /> : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Resolved
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Location Map */}
            {post.location?.coordinates && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location</h3>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 sm:h-48 flex items-center justify-center">
                  <p className="text-gray-600 dark:text-gray-400">Map placeholder</p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coordinates:</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm break-all">
                    {post.location.coordinates.latitude}, {post.location.coordinates.longitude}
                  </p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Reported</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {post.acknowledgedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Acknowledged</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(post.acknowledgedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {post.inProgressAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Investigation Started</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(post.inProgressAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {post.resolvedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Resolved</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(post.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostDetails