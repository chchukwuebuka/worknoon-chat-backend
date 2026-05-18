/**
 * Message Model
 * -------------
 * Individual messages within a conversation.
 * Each message belongs to a conversation and has a sender.
 *
 * Supports: text messages, file attachments, images
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Which conversation this message belongs to
    // Similar to Django's ForeignKey(Conversation, on_delete=CASCADE)
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    // Who sent this message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Message content (text body)
    content: {
      type: String,
      default: '',
    },
    // Type of message
    type: {
      type: String,
      enum: ['text', 'file', 'image', 'system'],
      default: 'text',
    },
    // File URL if message is a file/image
    fileUrl: {
      type: String,
      default: '',
    },
    // Original filename for downloads
    fileName: {
      type: String,
      default: '',
    },
    // Array of user IDs who have read this message
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // createdAt = when message was sent
  }
);

module.exports = mongoose.model('Message', messageSchema);
