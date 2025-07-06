class ErrorHandler {
  // Global error handling middleware
  handle = (error, req, res, next) => {
    console.error('Error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details
      });
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    // Handle database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Resource already exists'
      });
    }

    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid reference'
      });
    }

    // Handle custom application errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    // Default server error
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  };

  // 404 handler for non-existent routes
  notFound = (req, res) => {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  };

  // Async wrapper to catch errors in async route handlers
  asyncWrapper = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}

module.exports = new ErrorHandler();