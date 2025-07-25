"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, Trash2, ArrowLeft, Menu } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useSearchParams } from "react-router-dom"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"
import socket from "../services/socket" // Import the shared socket instance

const Chat = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [deletingMessage, setDeletingMessage] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef(null)
  const fetchTimeoutRef = useRef(null)
  // const sentMessagesRef = useRef(new Set()) // No longer needed with new optimistic update
  const messagesContainerRef = useRef(null)
  const creatingChatRef = useRef(false) // Prevent multiple simultaneous chat creation calls

  // Get user parameter from URL if provided
  const targetUserId = searchParams.get("user")

  // Initialize Socket.IO connection (now handled by the shared instance)
  useEffect(() => {
    // Join user's room for notifications
    if (user?._id) {
      socket.emit("join", user._id)
    }
  }, [user])

  // Optimized conversation update without full reload
  const updateConversationsList = useCallback((newChat) => {
    setConversations((prev) => {
      const existingIndex = prev.findIndex((chat) => chat._id === newChat._id)
      if (existingIndex >= 0) {
        // Update existing chat
        const updated = [...prev]
        updated[existingIndex] = newChat
        return updated
      } else {
        // Add new chat to the beginning
        return [newChat, ...prev]
      }
    })
  }, [])

  // Socket event listeners - optimized to avoid reloads
  useEffect(() => {
    if (!socket) return

    socket.on("new-message", (data) => {
      // Only process if this is for the active conversation
      if (data.chatId === activeConversation?._id) {
        // Assuming data.message.sender is an object with _id, consistent with `messages` state.
        const isFromCurrentUser = data.message.sender._id === user._id

        setMessages((prev) => {
          // Check if a message with this _id (from server) already exists
          const messageExists = prev.some((msg) => msg._id === data.message._id)

          if (!messageExists) {
            // If the message is new and not from the current user, add it.
            // Messages from the current user are handled by the API response in sendMessage.
            if (!isFromCurrentUser) {
              setTimeout(() => {
                markMessagesAsRead(data.chatId, [data.message._id])
              }, 1000)
              return [...prev, data.message]
            }
            // If it's from the current user and doesn't exist, it means the optimistic update
            // might have failed or was skipped, so add it. This is a fallback.
            return [...prev, data.message]
          }
          return prev // Message already exists, do nothing (prevents duplicates)
        })
      } else {
        // Update conversation unread count for non-active chats
        setConversations((prev) =>
          prev.map((conv) => (conv._id === data.chatId ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 } : conv)),
        )
      }
    })

    // Listen for new chat notifications - optimized
    socket.on("new-chat", (data) => {
      updateConversationsList(data.chat)
    })

    // Listen for message deletion
    socket.on("message-deleted", (data) => {
      if (data.chatId === activeConversation?._id) {
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId))
      }
    })

    return () => {
      socket.off("new-message")
      socket.off("new-chat")
      socket.off("message-deleted")
    }
  }, [socket, activeConversation, updateConversationsList, user._id])

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id)
      // Mark messages as read when chat is opened, but with a delay
      setTimeout(() => {
        markMessagesAsRead(activeConversation._id)
      }, 2000)
      // Close sidebar on mobile when conversation is selected
      if (window.innerWidth < 768) {
        setShowSidebar(false)
      }
    }
  }, [activeConversation])

  // Only auto-scroll for new messages from current user or when chat is first opened
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const isFromCurrentUser = lastMessage.sender._id === user._id // Ensure sender is an object
      // Only auto-scroll if the last message is from current user
      if (isFromCurrentUser) {
        scrollToBottom()
      }
    }
  }, [messages, user._id])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await api.get("/chats")
      const chats = response.data.data?.chats || []
      setConversations(chats)

      // If a target user is specified and it's a valid ID (not the string "undefined")
      if (targetUserId && targetUserId !== "undefined") {
        const existingChat = chats.find((chat) => chat.participants.some((p) => p.user._id === targetUserId))
        if (existingChat) {
          setActiveConversation(existingChat)
        } else {
          // Create a new chat with the target user
          await startChatWithUser(targetUserId)
        }
      } else if (chats.length > 0 && !activeConversation) {
        setActiveConversation(chats[0])
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const startChatWithUser = async (userId) => {
    // Defensive check: ensure userId is valid before proceeding
    if (!userId || userId === "undefined") {
      console.error("Cannot start chat: Invalid user ID provided.", userId)
      return
    }

    // Prevent multiple simultaneous calls
    if (creatingChatRef.current) {
      console.log("Chat creation already in progress, skipping...")
      return
    }

    try {
      creatingChatRef.current = true
      console.log("Starting chat with user:", userId)
      const response = await api.post(`/chats/start`, {
        providerId: userId,
      })
      const newChat = response.data.data.chat
      console.log("Chat created successfully:", newChat._id)
      updateConversationsList(newChat)
      setActiveConversation(newChat)
      // Join chat room for real-time updates
      if (socket) {
        socket.emit("join-chat", newChat._id)
      }
    } catch (error) {
      console.error("Failed to start chat:", error)
    } finally {
      creatingChatRef.current = false
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      // Don't show loading spinner for message fetch to avoid visible reload
      const response = await api.get(`/chats/${conversationId}/messages`)
      setMessages(response.data.data?.messages || [])
      // Join chat room for real-time updates
      if (socket) {
        socket.emit("join-chat", conversationId)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const markMessagesAsRead = async (chatId, messageIds = []) => {
    try {
      await api.patch(`/chats/${chatId}/read`, { messageIds })
      // Update conversation unread count without full reload
      setConversations((prev) => prev.map((conv) => (conv._id === chatId ? { ...conv, unreadCount: 0 } : conv)))
    } catch (error) {
      console.error("Failed to mark messages as read:", error)
      // Don't throw error, just log it to prevent UI issues
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || sendingMessage) return

    const messageContent = newMessage.trim()
    setSendingMessage(true)
    setNewMessage("")

    // Generate a temporary client-side ID for optimistic update
    const tempId = `optimistic-${Date.now()}-${Math.random()}`
    const optimisticMessage = {
      _id: tempId, // Temporary ID
      content: messageContent,
      sender: { _id: user._id, username: user.username, avatar: user.avatar }, // Ensure sender is an object
      chat: activeConversation._id,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isOptimistic: true, // Flag to identify optimistic message
    }

    setMessages((prev) => [...prev, optimisticMessage])
    requestAnimationFrame(() => {
      scrollToBottom()
    })

    try {
      const response = await api.post(`/chats/${activeConversation._id}/messages`, {
        content: messageContent,
      })
      const serverMessage = response.data.data.message

      // Replace the optimistic message with the server's authoritative message
      setMessages((prev) => prev.map((msg) => (msg._id === tempId ? { ...serverMessage, isOptimistic: false } : msg)))
    } catch (error) {
      console.error("Failed to send message:", error)
      // On error, remove the optimistic message
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId))
      setNewMessage(messageContent) // Restore message content
    } finally {
      setSendingMessage(false)
    }
  }

  const deleteMessage = async (messageId) => {
    if (!activeConversation || deletingMessage === messageId) return

    setDeletingMessage(messageId)
    try {
      await api.delete(`/chats/${activeConversation._id}/messages/${messageId}`)
      // Remove message from local state
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
      // Emit deletion to other users via socket
      if (socket) {
        socket.emit("delete-message", {
          chatId: activeConversation._id,
          messageId: messageId,
        })
      }
    } catch (error) {
      console.error("Failed to delete message:", error)
    } finally {
      setDeletingMessage(null)
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100
      // Only auto-scroll if user is already near bottom or if it's a new message from current user
      if (isAtBottom) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        })
      }
    }
  }

  const formatTime = (date) => {
    if (!date) return ""
    const messageDate = new Date(date)
    if (isNaN(messageDate.getTime())) return ""
    const now = new Date()
    const isToday = messageDate.toDateString() === now.toDateString()
    if (isToday) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return messageDate.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p.user._id !== user._id)
  }

  const handleBackToConversations = () => {
    setActiveConversation(null)
    setShowSidebar(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden relative w-full overflow-x-hidden">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Conversations List */}
      <div
        className={`
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static fixed top-0 left-0 z-50
          w-full md:w-1/3 lg:w-1/4 xl:w-1/3
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          flex flex-col h-full
          transition-transform duration-300 ease-in-out
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Search conversations..."
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
              {targetUserId &&
                targetUserId !== "undefined" && ( // Only show if a valid targetUserId is present
                  <button
                    onClick={() => startChatWithUser(targetUserId)}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start New Conversation
                  </button>
                )}
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              return (
                <div
                  key={`conversation-${conversation._id}`}
                  onClick={() => setActiveConversation(conversation)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    activeConversation?._id === conversation._id ? "bg-green-50 dark:bg-green-900/20" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={otherParticipant?.user?.avatar || "/TrashLance.png"}
                      alt={otherParticipant?.user?.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {otherParticipant?.user?.username}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {otherParticipant?.user?.role?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBackToConversations}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 -ml-2"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="hidden md:block lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 -ml-2"
                  >
                    <Menu className="h-5 w-5 text-gray-500" />
                  </button>
                  <img
                    src={getOtherParticipant(activeConversation)?.user?.avatar || "/TrashLance.png"}
                    alt={getOtherParticipant(activeConversation)?.user?.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {getOtherParticipant(activeConversation)?.user?.username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {getOtherParticipant(activeConversation)?.user?.role?.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0 w-full"
              ref={messagesContainerRef}
            >
              {messages.map((message, index) => (
                <div
                  key={`${message._id}-${message.sender._id}-${index}`}
                  className={`flex ${message.sender._id === user._id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-2xl relative group ${
                      message.sender._id === user._id
                        ? "bg-green-500 text-white rounded-br-md"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-xs ${
                          message.sender._id === user._id ? "text-green-100" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatTime(message.sentAt || message.createdAt)}
                      </p>
                      {message.sender._id === user._id && (
                        <button
                          onClick={() => deleteMessage(message._id)}
                          disabled={deletingMessage === message._id}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500 hover:text-white rounded"
                          title="Delete message"
                        >
                          {deletingMessage === message._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 md:p-4">
              <form onSubmit={sendMessage} className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className={`p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${sendingMessage ? "pointer-events-none" : ""}`}
                >
                  {sendingMessage ? <LoadingSpinner size="sm" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center px-4">
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View Conversations
              </button>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a conversation</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
