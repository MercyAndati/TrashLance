const express = require("express")
const router = express.Router()
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePostStatus,
  toggleUpvote,
  addComment,
  deletePost,
  getUserPosts,
  deleteComment,
} = require("../controllers/postController")
const { authenticateToken, requireAdmin } = require("../middleware/auth")
const { validateObjectId, handleValidationErrors } = require("../middleware/validation")
const { bookingImageUpload } = require("../config/cloudinary")
const { body } = require("express-validator")

// Public routes
router.get("/", getAllPosts)
router.get("/:id", validateObjectId("id"), getPostById)

// Protected routes
router.use(authenticateToken)

// Create post with image upload
router.post(
  "/",
  bookingImageUpload.array("images", 5), // Max 5 images
  [
    body("title").trim().isLength({ min: 5, max: 100 }).withMessage("Title must be between 5 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
    body("location").custom((value) => {
      try {
        const parsed = JSON.parse(value)
        if (!parsed.coordinates || !parsed.coordinates.latitude || !parsed.coordinates.longitude) {
          throw new Error("Valid coordinates are required")
        }
        return true
      } catch (error) {
        throw new Error("Invalid location format")
      }
    }),
    handleValidationErrors,
  ],
  createPost,
)

// Get current user's posts
router.get("/user/my-posts", getUserPosts)

// Toggle upvote
router.post("/:id/upvote", validateObjectId("id"), toggleUpvote)

// Add comment
router.post(
  "/:id/comments",
  [
    validateObjectId("id"),
    body("content").trim().isLength({ min: 1, max: 300 }).withMessage("Comment must be between 1 and 300 characters"),
    handleValidationErrors,
  ],
  addComment,
)
// Delete comment
router.delete(
  "/:postId/comments/:commentId",
  validateObjectId("postId"),
  validateObjectId("commentId"),
  deleteComment
)

// Update status (Admin/Government only)
router.patch(
  "/:id/status",
  [
    validateObjectId("id"),
    body("status")
      .isIn(["reported", "acknowledged", "in_progress", "completed", "rejected"])
      .withMessage("Invalid status"),
    body("notes").optional().trim().isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
    body("estimatedCleanupDate").optional().isISO8601().toDate().withMessage("Invalid date format"),
    handleValidationErrors,
  ],
  updatePostStatus,
)

// Delete post
router.delete("/:id", validateObjectId("id"), deletePost)

module.exports = router
