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
      // Optimistically add the new comment to the UI
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Post Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The post you're looking for doesn't exist.</p>
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
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Details</h1>
            {/* Delete post icon for author or admin */}
            {(user && (user._id === post.author?._id || user.role === "admin")) && (
              <button
                onClick={handleDeletePost}
                className="ml-4 text-red-500 hover:text-red-700"
                title="Delete post"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            #{post && post._id ? post._id.slice(-8) : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Post Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-2">
                {post.status ? (
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}>
    {post.status.replace("_", " ").toUpperCase()}
  </span>
) : null}
                  {post.severity && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(post.severity)}`}>
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
            {/* Status Stepper for admin/government */}
            {(user && ["admin", "government"].includes(user.role)) && (
              <div className="flex items-center space-x-4 mb-6">
                {statusSteps.map((step, idx) => (
                  <div key={step.value} className="flex items-center">
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        post.status === step.value
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-500 dark:bg-gray-700 dark:border-gray-600"
                      } ${actionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={actionLoading}
                      onClick={() => handleStatusStepClick(step.value)}
                      title={`Set status to ${step.label}`}
                    >
                      {step.value === "rejected" ? <X className="w-5 h-5" /> : idx + 1}
                    </button>
                    <span className={`ml-2 text-sm font-medium ${post.status === step.value ? "text-blue-600" : "text-gray-600 dark:text-gray-400"}`}>
                      {step.label}
                    </span>
                    {idx < statusSteps.length - 1 && (
                      <span className="mx-2 text-gray-400">→</span>
                    )}
                  </div>
                ))}
              </div>
            )}

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{post.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {post.location?.placeName || "Unknown location"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reported</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evidence Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {post.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.url || "/placeholder.svg"}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                      />
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
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Reported by {post.reporter?.username}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Comments ({post.comments?.length || 0})
              </h3>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Add a comment..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.author?.username}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {/* Delete icon for comment author or admin */}
                            {(user && (user._id === comment.author?._id || user.role === "admin")) && (
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="ml-2 text-red-500 hover:text-red-700"
                                title="Delete comment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No comments yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Actions for Government Users */}
            {user.role === "government" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>

                {post.status === "reported" && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleStatusUpdate("acknowledged")}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Acknowledge Report
                    </button>
                  </div>
                )}

                {post.status === "acknowledged" && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleStatusUpdate("in_progress")}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Start Investigation
                    </button>
                  </div>
                )}

                {post.status === "in_progress" && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleStatusUpdate("resolved")}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Location Map */}
            {post.location?.coordinates && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location</h3>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center">
                  <p className="text-gray-600 dark:text-gray-400">Map placeholder</p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coordinates:</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {post.location.coordinates.latitude}, {post.location.coordinates.longitude}
                  </p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Reported</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {post.acknowledgedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Acknowledged</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(post.acknowledgedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {post.inProgressAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Investigation Started</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(post.inProgressAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {post.resolvedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Resolved</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
