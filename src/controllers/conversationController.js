/**
 * Conversation Controller
 * ------------------------
 * Handles CRUD operations for conversations (chat threads).
 * Similar to Django's ViewSet for a Conversation model.
 */

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation (or return existing one for direct chats)
 * @access  Private
 */
const createConversation = async (req, res, next) => {
  try {
    const { participantId, type = 'direct', groupName = '' } = req.body;

    // For direct conversations, check if one already exists
    if (type === 'direct') {
      if (!participantId) {
        return res.status(400).json({
          success: false,
          message: 'participantId is required for direct conversations',
        });
      }

      const existingConversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [req.user._id, participantId], $size: 2 },
      }).populate('participants', 'name email role avatar isOnline lastSeen')
        .populate('lastMessage');

      if (existingConversation) {
        // Restore conversation if the user previously deleted it
        if (existingConversation.deletedBy && existingConversation.deletedBy.includes(req.user._id)) {
          existingConversation.deletedBy = existingConversation.deletedBy.filter(
            id => id.toString() !== req.user._id.toString()
          );
          await existingConversation.save();
        }

        return res.status(200).json({
          success: true,
          data: existingConversation,
        });
      }

      // Create new direct conversation
      const conversation = await Conversation.create({
        participants: [req.user._id, participantId],
        type: 'direct',
      });

      const populated = await conversation.populate(
        'participants',
        'name email role avatar isOnline lastSeen'
      );

      return res.status(201).json({
        success: true,
        data: populated,
      });
    }

    // Group conversation
    const { participantIds } = req.body;
    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Group conversations need at least 2 other participants',
      });
    }

    const conversation = await Conversation.create({
      participants: [req.user._id, ...participantIds],
      type: 'group',
      groupName,
    });

    const populated = await conversation.populate(
      'participants',
      'name email role avatar isOnline lastSeen'
    );

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for the logged-in user
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      deletedBy: { $ne: req.user._id },
    })
      .populate('participants', 'name email role avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/conversations/:id
 * @desc    Get a single conversation with its messages
 * @access  Private
 */
const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name email role avatar isOnline lastSeen');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation',
      });
    }

    // Get messages for this conversation
    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: 1 }); // Oldest first

    // Reset unread count for this user
    conversation.unreadCounts.set(req.user._id.toString(), 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/conversations/:id
 * @desc    Delete a conversation and all its messages
 * @access  Private (admin or participant)
 */
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Mark as deleted for this specific user (one-sided deletion)
    if (!conversation.deletedBy) {
      conversation.deletedBy = [];
    }
    
    if (!conversation.deletedBy.includes(req.user._id)) {
      conversation.deletedBy.push(req.user._id);
      await conversation.save();
    }

    // If ALL participants have deleted it, we can physically delete it from the DB
    if (conversation.deletedBy.length === conversation.participants.length) {
      await Message.deleteMany({ conversation: req.params.id });
      await Conversation.findByIdAndDelete(req.params.id);
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
};
