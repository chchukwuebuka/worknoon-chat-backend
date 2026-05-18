/**
 * ============================================
 *  Worknoon Chat Backend — Main Server File
 * ============================================
 *
 * This is the entry point of the application.
 * Similar to Django's manage.py + wsgi.py + urls.py combined.
 *
 * It sets up:
 * 1. Express app (the web framework)
 * 2. MongoDB connection (database)
 * 3. Socket.IO (real-time WebSocket communication)
 * 4. API Routes (REST endpoints)
 * 5. Static file serving (for uploads)
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import config and handlers
const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/middleware/errorHandler');
const setupSocket = require('./src/socket/socketHandler');

// Import routes (similar to Django's urlpatterns)
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

// ─── Initialize Express App ────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.IO Setup ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Initialize socket event handlers
setupSocket(io);

// ─── Middleware ─────────────────────────────────────────────────────
// Enable CORS (Cross-Origin Resource Sharing) for frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Parse JSON request bodies (like Django's JSONParser)
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files as static assets
app.use('/uploads', express.static(uploadsDir));

// ─── API Routes ────────────────────────────────────────────────────
// Similar to Django's urlpatterns in urls.py
app.use('/api/auth', authRoutes);          // /api/auth/register, /api/auth/login
app.use('/api/users', userRoutes);         // /api/users/me, /api/users, etc.
app.use('/api/conversations', conversationRoutes); // /api/conversations CRUD
app.use('/api/messages', messageRoutes);   // /api/messages CRUD
app.use('/api/upload', uploadRoutes);      // /api/upload file handling

// ─── Health Check Route ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Worknoon Chat API is running! 🚀',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ───────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Error Handler (must be last middleware) ────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  server.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   🚀 Worknoon Chat Backend Running!      ║
    ║                                          ║
    ║   🌐 Server:  http://localhost:${PORT}      ║
    ║   📡 Socket:  ws://localhost:${PORT}        ║
    ║   🔧 Mode:    ${process.env.NODE_ENV || 'development'}            ║
    ╚══════════════════════════════════════════╝
    `);
  });
};

startServer();
