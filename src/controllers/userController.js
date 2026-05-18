/**
 * User Controller
 * ----------------
 * Handles user-related operations.
 * Similar to Django's UserViewSet or user views.
 */

const User = require('../models/User');

/**
 * @route   GET /api/users/me
 * @desc    Get current logged-in user's profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
const updateMe = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users
 * @desc    Get all users (for starting new conversations)
 * @access  Private
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    let query = { _id: { $ne: req.user._id } }; // Exclude current user

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-__v');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Private
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/admin/all
 * @desc    Get all users with full details (Admin only)
 * @access  Private/Admin
 */
const getAllUsersAdmin = async (req, res, next) => {
  try {
    const users = await User.find().select('-__v');

    // Group users by role for the admin dashboard
    const stats = {
      total: users.length,
      byRole: {
        admin: users.filter((u) => u.role === 'admin').length,
        agent: users.filter((u) => u.role === 'agent').length,
        customer: users.filter((u) => u.role === 'customer').length,
        designer: users.filter((u) => u.role === 'designer').length,
        merchant: users.filter((u) => u.role === 'merchant').length,
      },
      online: users.filter((u) => u.isOnline).length,
    };

    res.status(200).json({
      success: true,
      stats,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateMe, getUsers, getUserById, getAllUsersAdmin };
