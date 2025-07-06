const axios = require('axios');

class AuthMiddleware {
  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  }

  // Middleware to verify JWT token via auth service
  verifyToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
      }

      // Call auth service to verify token
      const response = await axios.post(`${this.authServiceUrl}/auth/verify`, {}, {
        headers: {
          Authorization: authHeader
        }
      });

      if (!response.data.success) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      // Add user info to request object
      req.user = response.data.data.user;
      next();

    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired access token'
        });
      }

      console.error('Auth verification error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Authentication service unavailable'
      });
    }
  };

  // Middleware to check if user has manager or admin role
  requireManagerOrAdmin = async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role;

      if (!['manager', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            required: ['manager', 'admin']
          }
        });
      }

      next();

    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking user permissions'
      });
    }
  };

  // Middleware to check if user has admin role only
  requireAdmin = async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      next();

    } catch (error) {
      console.error('Admin check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking admin permissions'
      });
    }
  };

  // Combined middleware: verify token and check manager/admin role
  verifyManagerOrAdmin = [this.verifyToken, this.requireManagerOrAdmin];

  // Combined middleware: verify token and check admin role
  verifyAdmin = [this.verifyToken, this.requireAdmin];
}

module.exports = new AuthMiddleware();