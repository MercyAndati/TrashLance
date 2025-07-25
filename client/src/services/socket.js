import io from "socket.io-client"

// Determine the socket URL based on the environment
const socketUrl = import.meta.env.PROD ? "https://trashlance.onrender.com" : "http://localhost:5000"

// Create a single, shared Socket.IO client instance
const socket = io(socketUrl, {
  transports: ["polling", "websocket"], // Try polling first, then websocket
  withCredentials: true,
})

// Add debug listeners for the shared socket
socket.on("connect", () => {
  console.log("Shared Socket connected:", socket.id)
})

socket.on("connect_error", (error) => {
  console.error("Shared Socket connection error:", error)
})

socket.on("disconnect", (reason) => {
  console.log("Shared Socket disconnected:", reason)
})

export default socket
