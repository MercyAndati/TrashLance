"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, Trash2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useSearchParams } from "react-router-dom"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"
import io from "socket.io-client"

console.log("Chat component rendered")

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
  const [socket, setSocket] = useState(null)
  const messagesEndRef = useRef(null)
  const fetchTimeoutRef = useRef(null)
  const sentMessagesRef = useRef(new Set()) // Track sent messages to prevent duplicates
  const messagesContainerRef = useRef(null)
  const creatingChatRef = useRef(false) // Prevent multiple simultaneous chat creation calls
  const [conversationsLoading, setConversationsLoading] = useState(true)

  // Get user parameter from URL if provided
  const targetUserId = searchParams.get("user")

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(
      import.meta.env.PROD
        ? "https://trashlance.onrender.com"
        : "http://localhost:5000",
      {
        transports: ["websocket", "polling"],
        withCredentials: true,
      }
    )
    setSocket(newSocket)

    // Join user's room for notifications
    if (user?._id) {
      newSocket.emit("join", user._id)
    }

    return () => newSocket.close()
  }, [user])

  // Debounced fetch conversations
  const debouncedFetchConversations = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchConversations()
    }, 300)
  }, [])



  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    // Listen for new messages
    socket.on("new-message", (data) => {
      // Always update the conversation list
      debouncedFetchConversations()
      // If the message is for the current chat, add it to messages
      if (data.chatId === activeConversation?._id) {
        setMessages(prev => {
          const messageExists = prev.some(msg => msg._id === data.message._id)
          if (!messageExists) {
            setTimeout(() => {
              markMessagesAsRead(data.chatId, [data.message._id])
            }, 1000)
            return [...prev, data.message]
          }
          return prev
        })
      }
    })

    // Listen for new chat notifications
    socket.on("new-chat", (data) => {
      // Always update the conversation list
      debouncedFetchConversations()
    })

    // Listen for message deletion
    socket.on("message-deleted", (data) => {
      if (data.chatId === activeConversation?._id) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId))
      }
    })

    return () => {
      socket.off("new-message")
      socket.off("new-chat")
      socket.off("message-deleted")
    }
  }, [socket, activeConversation, debouncedFetchConversations, user._id])

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
    }
  }, [activeConversation])

  // Only auto-scroll for new messages from current user or when chat is first opened
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const isFromCurrentUser = lastMessage.sender === user._id
      
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
    console.log("fetchConversations called")
    try {
      setConversationsLoading(true)
      const response = await api.get("/chats")
      const chats = response.data.data?.chats || []
      setConversations(chats)
      
      // If a target user is specified, try to find or create a chat with them
      if (targetUserId) {
        const existingChat = chats.find(chat => 
          chat.participants.some(p => p.user._id === targetUserId)
        )
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
      setConversationsLoading(false)
    }
  }

  const startChatWithUser = async (userId) => {
    // Prevent multiple simultaneous calls
    if (creatingChatRef.current) {
      console.log("Chat creation already in progress, skipping...")
      return
    }
    
    try {
      creatingChatRef.current = true
      console.log("Starting chat with user:", userId)
      
      const response = await api.post("/chats/start", {
        providerId: userId
      })
      const newChat = response.data.data.chat
      console.log("Chat created successfully:", newChat._id)
      
      setConversations(prev => [newChat, ...prev])
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
    console.log("fetchMessages called")
    try {
      setLoading(true)
      const response = await api.get(`/chats/${conversationId}/messages`)
      setMessages(response.data.data?.messages || [])
      
      // Join chat room for real-time updates
      if (socket) {
        socket.emit("join-chat", conversationId)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async (chatId, messageIds = []) => {
    try {
      await api.patch(`/chats/${chatId}/read`, { messageIds })
      // Update conversations to reflect read status only if not in active chat
      if (!activeConversation || activeConversation._id !== chatId) {
        debouncedFetchConversations()
      }
    } catch (error) {
      console.error("Failed to mark messages as read:", error)
      // Don't throw error, just log it to prevent UI issues
    }
  }

  const sendMessage = async (e) => {
    console.log("sendMessage called")
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || sendingMessage) return

    const messageContent = newMessage.trim()
    setSendingMessage(true)
    setNewMessage("")

    try {
      const response = await api.post(`/chats/${activeConversation._id}/messages`, {
        content: messageContent,
      })

      const newMessageData = response.data.data.message
      
      // Add to sent messages tracking to prevent duplicates
      sentMessagesRef.current.add(newMessageData._id)
      
      // Add message to local state immediately
      setMessages((prev) => [...prev, newMessageData])
      
      // Scroll to bottom after sending own message (use requestAnimationFrame for smoother experience)
      requestAnimationFrame(() => {
        scrollToBottom()
      })
      
      // Clear from tracking after a delay
      setTimeout(() => {
        sentMessagesRef.current.delete(newMessageData._id)
      }, 5000)
      
    } catch (error) {
      console.error("Failed to send message:", error)
      // Restore message if send failed
      setNewMessage(messageContent)
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
      setMessages(prev => prev.filter(msg => msg._id !== messageId))
      
      // Emit deletion to other users via socket
      if (socket) {
        socket.emit("delete-message", {
          chatId: activeConversation._id,
          messageId: messageId
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
          <div className="mt-3 relative">
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
          {conversationsLoading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="md" />
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
              {targetUserId && (
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
                      className="w-12 h-12 rounded-full"
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
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={getOtherParticipant(activeConversation)?.user?.avatar || "/TrashLance.png"}
                    alt={getOtherParticipant(activeConversation)?.user?.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {getOtherParticipant(activeConversation)?.user?.username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getOtherParticipant(activeConversation)?.user?.role?.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0" ref={messagesContainerRef}>
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner size="md" />
                  <p className="text-gray-500 dark:text-gray-400 mt-4">Loading messages...</p>
                </div>
              ) : messages.map((message, index) => (
                <div
                  key={`${message._id}-${message.sender._id}-${index}`}
                  className={`flex ${message.sender._id === user._id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                      message.sender._id === user._id
                        ? "bg-green-500 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
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
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
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
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? <LoadingSpinner size="sm" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a conversation</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
