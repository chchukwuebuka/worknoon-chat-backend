/**
 * Error Handler Middleware
 * ------------------------
 * Catches all errors and sends a clean JSON response.
 * Similar to Django REST Framework's exception handler.
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId (invalid MongoDB ID format)
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Mongoose duplicate key error (e.g., duplicate email)
  if (err.code === 11000) {
    message = 'An account with this email already exists';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
  }

  console.error(`❌ Error: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { errorHandler };
