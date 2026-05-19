/**
 * Message Controller
 * -------------------
 * Handles sending and managing messages within conversations.
 * Works alongside Socket.IO for real-time delivery.
 */

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * @route   POST /api/messages
 * @desc    Send a new message in a conversation
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, type = 'text', fileUrl = '', fileName = '' } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId is required',
      });
    }

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation',
      });
    }

    // Create the message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content,
      type,
      fileUrl,
      fileName,
      readBy: [req.user._id], // Sender has already "read" their own message
    });

    // Populate sender info
    await message.populate('sender', 'name email role avatar');

    // Update conversation's lastMessage and unread counts
    conversation.lastMessage = message._id;

    // Increment unread count for all other participants
    for (const participantId of conversation.participants) {
      if (participantId.toString() !== req.user._id.toString()) {
        const pIdStr = participantId.toString();
        const currentCount = conversation.unreadCounts.get(pIdStr) || 0;
        conversation.unreadCounts.set(pIdStr, currentCount + 1);

        // BONUS: Send Email Notification if the user is offline
        try {
          const recipient = await User.findById(participantId);
          if (recipient && !recipient.isOnline) {
            // Fire and forget to avoid blocking the response
            sendEmail({
              email: recipient.email,
              subject: `New Message from ${req.user.name}`,
              message: `You have a new message on Worknoon Chat:\n\n"${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
            });
          }
        } catch (emailErr) {
          console.error("Failed to trigger email notification:", emailErr);
        }
      }
    }

    await conversation.save();

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/messages/:conversationId
 * @desc    Get all messages for a conversation (with pagination)
 * @access  Private
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: -1 }) // Newest first for pagination
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      conversation: conversationId,
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: messages.reverse(), // Return in chronological order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/messages/:id/read
 * @desc    Mark a message as read by the current user
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Add user to readBy if not already there
    if (!message.readBy.includes(req.user._id)) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/messages/read-all/:conversationId
 * @desc    Mark all messages in a conversation as read
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );

    // Reset unread count in conversation
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.unreadCounts.set(req.user._id.toString(), 0);
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: 'All messages marked as read',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getMessages, markAsRead, markAllAsRead };
