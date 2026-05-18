/**
 * Conversation Routes
 * --------------------
 * CRUD routes for chat conversations.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
} = require('../controllers/conversationController');

router.post('/', protect, createConversation);
router.get('/', protect, getConversations);
router.get('/:id', protect, getConversation);
router.delete('/:id', protect, deleteConversation);

module.exports = router;
