/**
 * Conversation Model
 * ------------------
 * Represents a chat thread between two or more users.
 * Think of it like a "Room" or "Thread" that holds messages.
 *
 * Supports: buyer-to-designer, buyer-to-merchant, buyer-to-agent, etc.
 */

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // Array of user IDs in this conversation
    // Similar to a ManyToManyField in Django
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Type of conversation
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    // Group name (only for group conversations)
    groupName: {
      type: String,
      default: '',
    },
    // Reference to the last message for quick preview
    // Similar to Django's ForeignKey with related_name
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // Track unread count per participant
    // Stored as a Map: { "userId": count }
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    // Track users who deleted this conversation (one-sided deletion)
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Conversation', conversationSchema);
