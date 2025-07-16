const Chat = require("../models/Chat")
const User = require("../models/User")
const Booking = require("../models/Booking")

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

    // Emit real-time message to other participants
    const io = req.app.get("io")
    chat.participants.forEach((participant) => {
      if (participant.user.toString() !== req.user._id.toString()) {
        io.to(participant.user.toString()).emit("new-message", {
          chatId: chat._id,
          message: populatedMessage,
        })
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

// Start chat with service provider
const startChatWithProvider = async (req, res) => {
  try {
    const { providerId, bookingId } = req.body

    // Verify provider exists and is a service provider
    const provider = await User.findById(providerId)
    if (!provider || provider.role !== "service_provider") {
      return res.status(404).json({
        success: false,
        message: "Service provider not found",
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
    const chat = await Chat.findOrCreateDirectChat(req.user._id, providerId, bookingId)

    await chat.populate([
      {
        path: "participants.user",
        select: "username avatar",
      },
      {
        path: "relatedBooking",
        select: "bookingNumber status",
      },
    ])

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

module.exports = {
  getUserChats,
  getChatMessages,
  sendMessage,
  startChatWithProvider,
  markAsRead,
}
