const Chat = require("../models/Chat")
const User = require("../models/User")
const Booking = require("../models/Booking")
const Notification = require("../models/Notification")

// Get user's chats
const getUserChats = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query

    const chats = await Chat.find({
      "participants.user": req.user._id,
      status: "active",
    })
      .populate([
        {
          path: "participants.user",
          select: "username avatar",
        },
        {
          path: "relatedBooking",
          select: "bookingNumber status",
        },
      ])
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    // Add unread count and last message to each chat
    const chatsWithDetails = chats.map((chat) => {
      const chatObj = chat.toObject()
      chatObj.unreadCount = chat.getUnreadCount(req.user._id)
      chatObj.lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null

      // Get the other participant (for direct chats)
      chatObj.otherParticipant = chatObj.participants.find((p) => p.user._id.toString() !== req.user._id.toString())

      return chatObj
    })

    res.json({
      success: true,
      data: { chats: chatsWithDetails },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get chat messages
const getChatMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const { chatId } = req.params

    const chat = await Chat.findById(chatId).populate([
      {
        path: "messages.sender",
        select: "username avatar",
      },
      {
        path: "participants.user",
        select: "username avatar",
      },
    ])

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      })
    }

    // Check if user is participant
    const isParticipant = chat.participants.some((p) => p.user._id.toString() === req.user._id.toString())

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Get paginated messages (most recent first)
    const totalMessages = chat.messages.length
    const startIndex = Math.max(0, totalMessages - page * limit)
    const endIndex = totalMessages - (page - 1) * limit

    const messages = chat.messages.slice(startIndex, endIndex)

    res.json({
      success: true,
      data: {
        chat: {
          _id: chat._id,
          participants: chat.participants,
          chatType: chat.chatType,
          relatedBooking: chat.relatedBooking,
        },
        messages,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: totalMessages,
          hasMore: startIndex > 0,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Send message
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params
    const { content, messageType = "text", metadata = {} } = req.body

    const chat = await Chat.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      })
    }

    // Check if user is participant
    const isParticipant = chat.participants.some((p) => p.user.toString() === req.user._id.toString())

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const message = chat.addMessage(req.user._id, content, messageType, metadata)
    await chat.save()

    // Populate the new message
    await chat.populate("messages.sender", "username avatar")
    const populatedMessage = chat.messages[chat.messages.length - 1]

    // Emit real-time message to chat room (excluding sender)
    const io = req.app.get("io")
    io.to(`chat-${chatId}`).emit("new-message", {
      chatId: chat._id,
      message: populatedMessage,
      senderId: req.user._id, // Add sender ID so frontend can filter
    })

    // Send notifications to other participants
    chat.participants.forEach(async (participant) => {
      if (participant.user.toString() !== req.user._id.toString()) {
        // Send in-app notification
        await Notification.createAndSend({
          recipient: participant.user,
          type: "chat_message",
          title: "New Message",
          message: `${req.user.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          category: "chat",
          data: {
            chatId: chat._id,
            messageId: populatedMessage._id,
            actionUrl: `/chat?chatId=${chat._id}`
          }
        })

        // Send socket notification for real-time updates
        console.log("Sending notification to user:", participant.user.toString())
        io.to(participant.user.toString()).emit("new-notification", {
          type: "chat_message",
          title: "New Message",
          message: `${req.user.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          data: {
            chatId: chat._id,
            messageId: populatedMessage._id
          }
        })
        console.log("Notification sent successfully")
      }
    })

    res.json({
      success: true,
      message: "Message sent successfully",
      data: { message: populatedMessage },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Start chat with user (any user, not just service providers)
const startChatWithUser = async (req, res) => {
  try {
    const { providerId, userId, bookingId } = req.body
    const targetUserId = providerId || userId

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      })
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // If bookingId provided, verify booking exists and user is involved
    let booking = null
    if (bookingId) {
      booking = await Booking.findById(bookingId)
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        })
      }

      const isInvolved =
        booking.customer.toString() === req.user._id.toString() ||
        booking.serviceProvider.toString() === req.user._id.toString()

      if (!isInvolved) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this booking",
        })
      }
    }

    // Find or create chat
    const chat = await Chat.findOrCreateDirectChat(req.user._id, targetUserId, bookingId)

    await chat.populate([
      {
        path: "participants.user",
        select: "username avatar role",
      },
      {
        path: "relatedBooking",
        select: "bookingNumber status",
      },
    ])

    // Check if this is a new chat (no messages yet) to avoid duplicate notifications
    const isNewChat = chat.messages.length === 0

    // Send notifications to both users only if it's a new chat
    if (isNewChat) {
      const io = req.app.get("io")
      
      // Notify the target user about the new chat
      io.to(targetUserId).emit("new-chat", {
        chatId: chat._id,
        initiator: req.user._id,
        message: `${req.user.username} started a conversation with you`
      })

      // Send email notification to target user
      await Notification.createAndSend({
        recipient: targetUserId,
        type: "new_chat",
        title: "New Conversation",
        message: `${req.user.username} started a conversation with you`,
        category: "chat",
        data: {
          chatId: chat._id,
          actionUrl: `/chat?chatId=${chat._id}`
        }
      })

      // Send email notification to initiator
      await Notification.createAndSend({
        recipient: req.user._id,
        type: "new_chat",
        title: "Conversation Started",
        message: `You started a conversation with ${targetUser.username}`,
        category: "chat",
        data: {
          chatId: chat._id,
          actionUrl: `/chat?chatId=${chat._id}`
        }
      })
    }

    res.json({
      success: true,
      message: "Chat started successfully",
      data: { chat },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to start chat",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Keep the old function for backward compatibility
const startChatWithProvider = startChatWithUser

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params
    const { messageIds = [] } = req.body

    const chat = await Chat.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      })
    }

    // Check if user is participant
    const isParticipant = chat.participants.some((p) => p.user.toString() === req.user._id.toString())

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    chat.markAsRead(req.user._id, messageIds)
    await chat.save()

    res.json({
      success: true,
      message: "Messages marked as read",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params

    const chat = await Chat.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      })
    }

    // Check if user is participant
    const isParticipant = chat.participants.some((p) => p.user.toString() === req.user._id.toString())

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Find the message
    const message = chat.messages.id(messageId)
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      })
    }

    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      })
    }

    // Remove the message
    chat.messages.pull(messageId)
    await chat.save()

    // Emit real-time deletion to chat room
    const io = req.app.get("io")
    io.to(`chat-${chatId}`).emit("message-deleted", {
      chatId: chat._id,
      messageId: messageId,
    })

    res.json({
      success: true,
      message: "Message deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

module.exports = {
  getUserChats,
  getChatMessages,
  sendMessage,
  startChatWithProvider,
  markAsRead,
  deleteMessage,
}
