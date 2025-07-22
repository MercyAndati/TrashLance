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
    // New field for direct chat uniqueness: stores sorted participant IDs
    sortedParticipantIds: {
      type: [mongoose.Schema.Types.ObjectId],
      // This field will only be populated for 'direct' chats
    },
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


chatSchema.index({ "participants.user": 1 })
chatSchema.index({ lastActivity: -1 })
chatSchema.index({ "messages.sentAt": -1 })


// New unique index for booking chats
chatSchema.index(
  { relatedBooking: 1 },
  {
    unique: true,
    partialFilterExpression: { chatType: "booking", status: "active" },
  },
)

// Method to add message (no changes needed)
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

// Method to mark messages as read (no changes needed)
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

// Method to get unread message count for a user (no changes needed)
chatSchema.methods.getUnreadCount = function (userId) {
  return this.messages.filter((message) => {
    const isNotSender = message.sender.toString() !== userId.toString()
    const isNotRead = !message.readBy.some((read) => read.user.toString() === userId.toString())
    return isNotSender && isNotRead
  }).length
}

// Static method to find or create chat between users
chatSchema.statics.findOrCreateDirectChat = async function (user1Id, user2Id, relatedBooking = null) {
  try {
    const user1IdStr = user1Id.toString()
    const user2IdStr = user2Id.toString()
    const chatType = relatedBooking ? "booking" : "direct"

    console.log(`Looking for chat between ${user1IdStr} and ${user2IdStr}, booking: ${relatedBooking}`)

    let chat = null
    if (chatType === "direct") {
      // For direct chats, sort the participant IDs to ensure consistent lookup
      const sortedIds = [user1Id, user2Id].sort((a, b) => a.toString().localeCompare(b.toString()))
      // Use the sorted string for lookup
      const sortedIdsString = sortedIds.join("_") // e.g., "id1_id2"
      chat = await this.findOne({
        sortedParticipantIdsString: sortedIdsString, // Use the new field for lookup
        chatType: "direct",
        status: "active",
      })
    } else if (chatType === "booking" && relatedBooking) {
      // For booking chats, use the relatedBooking ID
      chat = await this.findOne({
        relatedBooking: relatedBooking,
        chatType: "booking",
        status: "active",
      })
    }

    if (chat) {
      console.log(`Found existing chat: ${chat._id}`)
      return chat
    }

    console.log(`Creating new chat between ${user1IdStr} and ${user2IdStr}`)

    try {
      const newChatData = {
        participants: [{ user: user1Id }, { user: user2Id }],
        chatType: chatType,
        ...(relatedBooking && { relatedBooking }),
      }

      if (chatType === "direct") {
        const sortedIds = [user1Id, user2Id].sort((a, b) => a.toString().localeCompare(b.toString()))
        newChatData.sortedParticipantIds = sortedIds // Keep this for reference if needed
        newChatData.sortedParticipantIdsString = sortedIds.join("_") // Store the string for uniqueness
      }

      chat = new this(newChatData)
      console.log("Attempting to save new chat with newChatData:", JSON.stringify(newChatData, null, 2))
      await chat.save()

      console.log(`Created new chat: ${chat._id}`)
      return chat
    } catch (error) {
      // If duplicate key error, try to find the existing chat again
      if (error.code === 11000) {
        console.log("Duplicate chat detected during creation, finding existing chat...")
        let existingChat = null
        if (chatType === "direct") {
          const sortedIds = [user1Id, user2Id].sort((a, b) => a.toString().localeCompare(b.toString()))
          const sortedIdsString = sortedIds.join("_")
          existingChat = await this.findOne({
            sortedParticipantIdsString: sortedIdsString,
            chatType: "direct",
            status: "active",
          })
        } else if (chatType === "booking" && relatedBooking) {
          existingChat = await this.findOne({
            relatedBooking: relatedBooking,
            chatType: "booking",
            status: "active",
          })
        }

        if (existingChat) {
          console.log(`Found existing chat after duplicate error: ${existingChat._id}`)
          return existingChat
        }
      }
      throw error
    }
  } catch (error) {
    console.error("Error in findOrCreateDirectChat:", error)
    throw error
  }
}

module.exports = mongoose.model("Chat", chatSchema)
