/**
 * User Routes
 * -----------
 * All routes require authentication (protect middleware).
 * Admin-only routes also require roleCheck middleware.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const {
  getMe,
  updateMe,
  getUsers,
  getUserById,
  getAllUsersAdmin,
} = require('../controllers/userController');

// User routes (authenticated)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/', protect, getUsers);
router.get('/admin/all', protect, roleCheck('admin'), getAllUsersAdmin);
router.get('/:id', protect, getUserById);

module.exports = router;
