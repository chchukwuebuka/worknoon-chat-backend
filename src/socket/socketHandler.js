/**
 * Socket.IO Handler
 * ------------------
 * Manages real-time communication for the chat system.
 * Similar to Django Channels consumers.
 *
 * Events:
 * - connection:     User connects to socket
 * - user:online:    User comes online
 * - join:room:      User joins a conversation room
 * - message:send:   User sends a message
 * - typing:start:   User starts typing
 * - typing:stop:    User stops typing
 * - disconnect:     User disconnects
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const setupSocket = (io) => {
  // Authenticate socket connections using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket (like Django's scope["user"])
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🟢 User connected: ${socket.user.name} (${socket.user._id})`);

    // Mark user as online
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

    // Broadcast online status to all connected clients
    socket.broadcast.emit('user:online', {
      userId: socket.user._id,
      isOnline: true,
    });

    /**
     * Join a conversation room
     * When a user opens a chat, they join the room to receive real-time messages
     */
    socket.on('join:room', (conversationId) => {
      socket.join(conversationId);
      console.log(
        `📥 ${socket.user.name} joined room: ${conversationId}`
      );
    });

    /**
     * Leave a conversation room
     */
    socket.on('leave:room', (conversationId) => {
      socket.leave(conversationId);
      console.log(
        `📤 ${socket.user.name} left room: ${conversationId}`
      );
    });

    /**
     * Handle sending a message in real-time
     * This works alongside the REST API — the API saves to DB,
     * and Socket.IO broadcasts to all participants in real-time.
     */
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text', fileUrl = '', fileName = '' } = data;

        // Create and save the message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          content,
          type,
          fileUrl,
          fileName,
          readBy: [socket.user._id],
        });

        // Populate sender info
        await message.populate('sender', 'name email role avatar');

        // Update conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = message._id;
          conversation.participants.forEach((participantId) => {
            if (participantId.toString() !== socket.user._id.toString()) {
              const currentCount =
                conversation.unreadCounts.get(participantId.toString()) || 0;
              conversation.unreadCounts.set(
                participantId.toString(),
                currentCount + 1
              );
            }
          });
          await conversation.save();
        }

        // Broadcast message to everyone in the room (including sender)
        io.to(conversationId).emit('message:received', message);

        // Also emit to all participants for inbox updates
        if (conversation) {
          conversation.participants.forEach((participantId) => {
            io.to(participantId.toString()).emit('conversation:updated', {
              conversationId,
              lastMessage: message,
            });
          });
        }
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicators
     */
    socket.on('typing:start', (conversationId) => {
      socket.to(conversationId).emit('typing:start', {
        userId: socket.user._id,
        name: socket.user.name,
        conversationId,
      });
    });

    socket.on('typing:stop', (conversationId) => {
      socket.to(conversationId).emit('typing:stop', {
        userId: socket.user._id,
        conversationId,
      });
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.user.name}`);

      // Mark user as offline
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Broadcast offline status
      socket.broadcast.emit('user:online', {
        userId: socket.user._id,
        isOnline: false,
      });
    });

    // Join a personal room (for receiving notifications)
    socket.join(socket.user._id.toString());
  });
};

module.exports = setupSocket;
