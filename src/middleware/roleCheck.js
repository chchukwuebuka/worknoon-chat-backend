/**
 * Role Check Middleware
 * ---------------------
 * Restricts access based on user roles.
 * Similar to Django REST Framework's custom permission classes.
 *
 * Usage: router.get('/admin', protect, roleCheck('admin'), adminDashboard)
 *
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'agent')
 */

const roleCheck = (...roles) => {
  return (req, res, next) => {
    // Check if the logged-in user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { roleCheck };
