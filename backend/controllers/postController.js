const Post = require("../models/Post")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { deleteImage } = require("../config/cloudinary")

// Create a new post
const createPost = async (req, res) => {
  try {
    const { title, description, location, category, severity, tags } = req.body

    // Validate required images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      })
    }

    // Process uploaded images
    const images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      caption: file.originalname,
    }))

    const post = new Post({
      title,
      description,
      author: req.user._id,
      location: JSON.parse(location), // Parse location from form data
      images,
      category: category || "illegal_dumping",
      severity: severity || "medium",
      tags: tags ? JSON.parse(tags) : [],
    })

    await post.save()

    // Populate author info for response
    await post.populate("author", "username avatar")

    // Award points to user for reporting
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } })

    // Notify government users about new report
    const governmentUsers = await User.find({ role: "government" })
    for (const govUser of governmentUsers) {
      await Notification.createAndSend({
        recipient: govUser._id,
        type: "new_report",
        title: "New Illegal Dumping Report",
        message: `New report: ${title} in ${location.placeName || "Unknown location"}`,
        category: "system",
        data: {
          postId: post._id,
          actionUrl: `/posts/${post._id}`,
        },
      })
    }

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: { post },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get all posts with filters
const getAllPosts = async (req, res) => {
  try {
    const {
      category,
      status,
      severity,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      lat,
      lng,
      radius = 10, // km
    } = req.query

    const query = { isPublic: true }

    // Apply filters
    if (category) query.category = category
    if (status) query.status = status
    if (severity) query.severity = severity

    // Location-based filtering
    if (lat && lng) {
      query["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      }
    }

    const options = {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
      populate: [
        { path: "author", select: "username avatar points" },
        { path: "assignedTo", select: "username" },
        { path: "comments.author", select: "username avatar" },
      ],
    }

    const posts = await Post.paginate(query, options)

    res.json({
      success: true,
      data: posts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get post by ID
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username avatar points")
      .populate("assignedTo", "username")
      .populate("comments.author", "username avatar")
      .populate("statusHistory.updatedBy", "username")

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    res.json({
      success: true,
      data: { post },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Update post status (Admin/Government only)
const updatePostStatus = async (req, res) => {
  try {
    const { status, notes, estimatedCleanupDate } = req.body

    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Only admin or government can update status
    if (!["admin", "government"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    post.updateStatus(status, req.user._id, notes)

    if (estimatedCleanupDate) {
      post.estimatedCleanupDate = estimatedCleanupDate
    }

    if (status === "in_progress" && !post.assignedTo) {
      post.assignedTo = req.user._id
    }

    await post.save()

    // Notify post author about status update
    await Notification.createAndSend({
      recipient: post.author,
      type: "status_update",
      title: "Report Status Updated",
      message: `Your report "${post.title}" status has been updated to ${status}`,
      category: "system",
      data: {
        postId: post._id,
        actionUrl: `/posts/${post._id}`,
      },
    })

    res.json({
      success: true,
      message: "Post status updated successfully",
      data: { post },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update post status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Toggle upvote on post
const toggleUpvote = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    const added = post.toggleUpvote(req.user._id)
    await post.save()

    // Award points to post author if upvoted
    if (added) {
      await User.findByIdAndUpdate(post.author, { $inc: { points: 2 } })
    } else {
      await User.findByIdAndUpdate(post.author, { $inc: { points: -2 } })
    }

    res.json({
      success: true,
      message: added ? "Post upvoted" : "Upvote removed",
      data: {
        upvoted: added,
        upvoteCount: post.upvotes.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to toggle upvote",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Add comment to post
const addComment = async (req, res) => {
  try {
    const { content } = req.body

    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    const comment = {
      author: req.user._id,
      content,
      isOfficial: ["admin", "government"].includes(req.user.role),
    }

    post.comments.push(comment)
    await post.save()

    // Populate the new comment
    await post.populate("comments.author", "username avatar")
    const newComment = post.comments[post.comments.length - 1]

    // Notify post author about new comment (if not commenting on own post)
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.createAndSend({
        recipient: post.author,
        type: "new_comment",
        title: "New Comment on Your Report",
        message: `${req.user.username} commented on your report "${post.title}"`,
        category: "system",
        data: {
          postId: post._id,
          actionUrl: `/posts/${post._id}`,
        },
      })
    }

    res.json({
      success: true,
      message: "Comment added successfully",
      data: { comment: newComment },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Delete post (Author or Admin only)
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Check permissions
    const canDelete = post.author.toString() === req.user._id.toString() || req.user.role === "admin"

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Delete images from Cloudinary
    for (const image of post.images) {
      if (image.publicId) {
        try {
          await deleteImage(image.publicId)
        } catch (error) {
          console.error("Failed to delete image:", error)
        }
      }
    }

    await Post.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Post deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get user's posts
const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const options = {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: "author", select: "username avatar" },
        { path: "assignedTo", select: "username" },
      ],
    }

    const posts = await Post.paginate({ author: req.user._id }, options)

    res.json({
      success: true,
      data: posts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePostStatus,
  toggleUpvote,
  addComment,
  deletePost,
  getUserPosts,
}
