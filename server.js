const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { initializeSocket } = require("./socket");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const sessionsRoutes = require("./routes/sessions");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Store user info for cleanup
  let userInfo = null;
  let heartbeatInterval = null;
  
  // Set up heartbeat to detect disconnections
  const startHeartbeat = () => {
    heartbeatInterval = setInterval(() => {
      socket.emit('ping');
    }, 30000); // Ping every 30 seconds
  };
  
  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };
  
  // Start heartbeat
  startHeartbeat();
  
  // Handle pong responses
  socket.on('pong', () => {
    // Connection is alive, no action needed
  });
  
  // Handle typing indicators
  socket.on('userTyping', (data) => {
    userInfo = data; // Store user info for cleanup
    // Broadcast to all other clients
    socket.broadcast.emit('userTyping', data);
  });
  
  socket.on('userStoppedTyping', (data) => {
    userInfo = null; // Clear user info
    // Broadcast to all other clients
    socket.broadcast.emit('userStoppedTyping', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    stopHeartbeat();
    // If user was typing and disconnected, emit stopped typing
    if (userInfo) {
      console.log('Cleaning up typing indicator for disconnected user:', userInfo.username);
      socket.broadcast.emit('userStoppedTyping', userInfo);
    }
  });
});

// Trust proxy - important for getting real IP behind reverse proxies (Heroku, Netlify, etc.)
app.set("trust proxy", true);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (profile pictures)
app.use("/profile-pics", express.static("profile-pics"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "The Sessions API is running" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 3003;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
