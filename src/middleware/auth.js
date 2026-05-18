/**
 * Auth Middleware
 * ---------------
 * Protects routes by verifying JWT tokens.
 * Similar to Django REST Framework's IsAuthenticated permission class.
 *
 * Usage: Add `protect` to any route that requires login.
 * Example: router.get('/profile', protect, getProfile)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  // Format: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided',
    });
  }

  try {
    // Verify the token (like Django's token authentication)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request object (like Django's request.user)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token',
    });
  }
};

module.exports = { protect };
