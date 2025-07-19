const express = require("express")
const router = express.Router()
const {
  getUserChats,
  getChatMessages,
  sendMessage,
  startChatWithProvider,
  markAsRead,
  deleteMessage,
} = require("../controllers/chatController")
const { authenticateToken } = require("../middleware/auth")
const { handleValidationErrors } = require("../middleware/validation")
const { body, param } = require("express-validator")

// Inline validation helper
const validateChatId = [param("chatId").isMongoId().withMessage("Invalid chat ID"), handleValidationErrors]

// All chat routes require authentication
router.use(authenticateToken)

// Backward compatibility: /conversations redirects to /chats
router.get("/conversations", getUserChats)

// Get user's chats
router.get("/", getUserChats)

// Start chat with service provider
router.post(
  "/start",
  [
    body("providerId").isMongoId().withMessage("Valid provider ID required"),
    body("bookingId").optional().isMongoId().withMessage("Valid booking ID required"),
    handleValidationErrors,
  ],
  startChatWithProvider,
)

// Get chat messages
router.get("/:chatId/messages", validateChatId, getChatMessages)

// Send message
router.post(
  "/:chatId/messages",
  [
    param("chatId").isMongoId().withMessage("Invalid chat ID"),
    body("content").trim().isLength({ min: 1, max: 1000 }).withMessage("Message must be 1-1000 characters"),
    body("messageType").optional().isIn(["text", "image", "location"]).withMessage("Invalid message type"),
    handleValidationErrors,
  ],
  sendMessage,
)

// Delete message
router.delete(
  "/:chatId/messages/:messageId",
  [
    param("chatId").isMongoId().withMessage("Invalid chat ID"),
    param("messageId").isMongoId().withMessage("Invalid message ID"),
    handleValidationErrors,
  ],
  deleteMessage,
)

// Mark messages as read
router.patch(
  "/:chatId/read",
  [
    param("chatId").isMongoId().withMessage("Invalid chat ID"),
    body("messageIds").optional().isArray().withMessage("Message IDs must be an array"),
    handleValidationErrors,
  ],
  markAsRead,
)

module.exports = router
