const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const { createServer } = require("http")
const { Server } = require("socket.io")
require("dotenv").config()

// Import routes - TEMPORARILY DISABLE NEW ROUTES
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const serviceRoutes = require("./routes/services")
const bookingRoutes = require("./routes/bookings")
const adminRoutes = require("./routes/admin")
const notificationRoutes = require("./routes/notifications")
const subscriptionRoutes = require("./routes/subscriptions")
const postRoutes = require("./routes/posts")
const pickupZoneRoutes = require("./routes/pickupZones") // TEMPORARILY DISABLED
const chatRoutes = require("./routes/chats") // TEMPORARILY DISABLED
const locationRoutes = require("./routes/location")

// ✅ Verify email configuration at startup
const { verifyEmailConfig } = require("./utils/email")
verifyEmailConfig()

// Import middleware
const errorHandler = require("./middleware/errorHandler")
const { authenticateToken } = require("./middleware/auth")

const app = express()
const server = createServer(app)

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
})

// Make io accessible to routes
app.set("io", io)

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// CORS configuration
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// Database connection - FIXED: Removed deprecated options
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/trashlance")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

console.log("DEBUG: Loading routes...")

// Routes - CORE ROUTES ONLY FOR NOW
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/services", serviceRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/subscriptions", subscriptionRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/pickup-zones", pickupZoneRoutes) // TEMPORARILY DISABLED
app.use("/api/chats", chatRoutes) // TEMPORARILY DISABLED
app.use("/api/location", locationRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Trashlance API is running",
    timestamp: new Date().toISOString(),
  })
})

// Enhanced Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join user to their room for notifications
  socket.on("join", (userId) => {
    socket.join(userId)
    console.log(`User ${userId} joined their room`)
  })

  // Join chat room
  socket.on("join-chat", (chatId) => {
    socket.join(`chat-${chatId}`)
    console.log(`User joined chat room: chat-${chatId}`)
  })

  // Leave chat room
  socket.on("leave-chat", (chatId) => {
    socket.leave(`chat-${chatId}`)
    console.log(`User left chat room: chat-${chatId}`)
  })

  // Handle real-time location updates
  socket.on("location-update", (data) => {
    socket.to(data.bookingId).emit("location-update", data)
  })

  // Handle booking status updates
  socket.on("booking-status", (data) => {
    socket.to(data.userId).emit("booking-status", data)
  })

  // Handle typing indicators
  socket.on("typing", (data) => {
    socket.to(`chat-${data.chatId}`).emit("typing", {
      userId: data.userId,
      username: data.username,
    })
  })

  socket.on("stop-typing", (data) => {
    socket.to(`chat-${data.chatId}`).emit("stop-typing", {
      userId: data.userId,
    })
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
})

module.exports = app
