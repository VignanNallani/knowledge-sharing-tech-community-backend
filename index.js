import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import http from "http";
import { Server as IOServer } from "socket.io";

// Routes - ✅ FIXED IMPORT
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import chatRoutes from "./routes/chat.js";
import eventRoutes from "./routes/event.js";
import mentorshipRoutes from "./routes/mentorship.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import commentRoutes from "./routes/comments.js";
import uploadRoutes from "./routes/uploads.js";
import slotRoutes from "./routes/slots.js";
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'

// Middleware
import { authenticateToken } from "./middleware/authMiddleware.js";

const app = express();
const prisma = new PrismaClient();

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Basic Socket handlers for conversations/messages
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (conversationId) => {
    if (!conversationId) return;
    socket.join(conversationId);
  });

  socket.on("leave", (conversationId) => {
    if (!conversationId) return;
    socket.leave(conversationId);
  });

  socket.on("sendMessage", async (payload) => {
    try {
      const { conversationId, senderId, body } = payload;
      if (!conversationId || !senderId || !body) return;
      // Persist message via Prisma
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: Number(senderId),
          body,
        },
      });
      io.to(conversationId).emit("message", message);
    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    // console.log('Socket disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Ping route for frontend testing
app.get("/ping", (req, res) => {
  res.json({ message: "Backend is alive!" });
});

// Routes
// ...existing code...

// Routes
// ...existing code...

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", authenticateToken, postRoutes);
app.use("/api/mentorship", mentorshipRoutes);  // ✅ ADD THIS
app.use("/api/chat", authenticateToken, chatRoutes);
app.use("/api/events", authenticateToken, eventRoutes);
app.use("/api/admin", authenticateToken, adminRoutes);
app.use("/api/comments", authenticateToken, commentRoutes);
// serve static uploads
app.use('/uploads', express.static('uploads'))
app.use('/api/uploads', authenticateToken, uploadRoutes);
app.use('/api/slots', slotRoutes);

// Swagger UI (minimal spec)
try{
  const openapiPath = path.join(process.cwd(), 'backend', 'docs', 'openapi.json')
  if (fs.existsSync(openapiPath)){
    const spec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'))
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec))
  }
}catch(e){ console.warn('Failed to mount Swagger UI', e.message) }

// ...existing code...
// ...existing code...
// Test: Fetch all users
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Global error handling
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Server start (use HTTP server with Socket.IO)
const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Server (with WebSocket) running at http://localhost:${PORT}`);
  });
} else {
  console.log('Test mode: server not started automatically.');
}

// Export for tests
export { app, server };