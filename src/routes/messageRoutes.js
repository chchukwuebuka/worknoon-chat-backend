/**
 * Message Routes
 * ---------------
 * Routes for sending and managing messages.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  markAsRead,
  markAllAsRead,
} = require('../controllers/messageController');

router.post('/', protect, sendMessage);
router.get('/:conversationId', protect, getMessages);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all/:conversationId', protect, markAllAsRead);

module.exports = router;
