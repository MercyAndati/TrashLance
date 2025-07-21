const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastSeen: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Related booking if this chat is about a specific booking
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },

    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: [1000, "Message cannot exceed 1000 characters"],
        },
        messageType: {
          type: String,
          enum: ["text", "image", "location", "system"],
          default: "text",
        },
        metadata: {
          imageUrl: String,
          location: {
            latitude: Number,
            longitude: Number,
            address: String,
          },
          systemType: String, // For system messages like 'booking_created', 'status_changed'
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        readBy: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            readAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        edited: {
          isEdited: {
            type: Boolean,
            default: false,
          },
          editedAt: Date,
          originalContent: String,
        },
      },
    ],

    chatType: {
      type: String,
      enum: ["direct", "booking", "support"],
      default: "direct",
    },

    status: {
      type: String,
      enum: ["active", "archived", "blocked"],
      default: "active",
    },

    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // Chat settings
    settings: {
      notifications: {
        type: Boolean,
        default: true,
      },
      autoArchiveAfterDays: {
        type: Number,
        default: 30,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
chatSchema.index({ "participants.user": 1 })
chatSchema.index({ relatedBooking: 1 })
chatSchema.index({ lastActivity: -1 })
chatSchema.index({ "messages.sentAt": -1 })

// Unique compound index to prevent duplicate chats between the same users
chatSchema.index(
  { 
    "participants.user": 1, 
    chatType: 1, 
    relatedBooking: 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: { status: "active" }
  }
)

// Method to add message
chatSchema.methods.addMessage = function (senderId, content, messageType = "text", metadata = {}) {
  const message = {
    sender: senderId,
    content,
    messageType,
    metadata,
  }

  this.messages.push(message)
  this.lastActivity = new Date()

  return this.messages[this.messages.length - 1]
}

// Method to mark messages as read
chatSchema.methods.markAsRead = function (userId, messageIds = []) {
  try {
    if (messageIds.length === 0) {
      // Mark all unread messages as read
      this.messages.forEach((message) => {
        if (message && message.sender && message.readBy) {
          const alreadyRead = message.readBy.some((read) => read.user.toString() === userId.toString())

          if (!alreadyRead && message.sender.toString() !== userId.toString()) {
            message.readBy.push({ user: userId })
          }
        }
      })
    } else {
      // Mark specific messages as read
      messageIds.forEach((messageId) => {
        const message = this.messages.id(messageId)
        if (message && message.readBy) {
          const alreadyRead = message.readBy.some((read) => read.user.toString() === userId.toString())

          if (!alreadyRead) {
            message.readBy.push({ user: userId })
          }
        }
      })
    }

    // Update participant's last seen
    const participant = this.participants.find((p) => p.user.toString() === userId.toString())
    if (participant) {
      participant.lastSeen = new Date()
    }
  } catch (error) {
    console.error("Error in markAsRead:", error)
    // Don't throw error, just log it
  }
}

// Method to get unread message count for a user
chatSchema.methods.getUnreadCount = function (userId) {
  return this.messages.filter((message) => {
    const isNotSender = message.sender.toString() !== userId.toString()
    const isNotRead = !message.readBy.some((read) => read.user.toString() === userId.toString())
    return isNotSender && isNotRead
  }).length
}

// Static method to find or create chat between users
chatSchema.statics.findOrCreateDirectChat = async function (user1Id, user2Id, relatedBooking = null) {
  // Always sort user IDs for consistent storage and querying
  const user1IdStr = user1Id.toString();
  const user2IdStr = user2Id.toString();
  const sortedUserIds = [user1IdStr, user2IdStr].sort();

  console.log(`Looking for chat between ${sortedUserIds[0]} and ${sortedUserIds[1]}, booking: ${relatedBooking}`)
  // Try to find existing chat with more specific query
  let chat = await this.findOne({
    chatType: relatedBooking ? "booking" : "direct",
    "participants.user": { $all: sortedUserIds },
    status: "active",
    ...(relatedBooking && { relatedBooking }),
  })

  if (chat) {
    console.log(`Found existing chat: ${chat._id}`)
    return chat
  }

  // Check if there are any other chats between these users (in case of duplicates)
  const existingChats = await this.find({
    "participants.user": { $all: sortedUserIds },
    status: "active",
    ...(relatedBooking && { relatedBooking }),
  })

  if (existingChats.length > 0) {
    console.log(`Found ${existingChats.length} existing chats, using the first one`)
    return existingChats[0]
  }

  console.log(`Creating new chat between ${sortedUserIds[0]} and ${sortedUserIds[1]}`)
  // Create new chat (let errors bubble up to controller)
  chat = new this({
    participants: [{ user: sortedUserIds[0] }, { user: sortedUserIds[1] }],
    chatType: relatedBooking ? "booking" : "direct",
    ...(relatedBooking && { relatedBooking }),
  })
  await chat.save()
  console.log(`Created new chat: ${chat._id}`)
  return chat
}

module.exports = mongoose.model("Chat", chatSchema)
