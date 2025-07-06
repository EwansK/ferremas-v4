const jwt = require('jsonwebtoken');
const database = require('../utils/database');
const ActivityLog = require('../models/ActivityLog');

class AdminAuthMiddleware {
  // Verify JWT token and ensure user is authenticated
  verifyToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user details from database
      const userResult = await database.query(
        'SELECT id, email, name, lastname, role, active FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];

      if (!user.active) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      // Add user info to request object
      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token has expired'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error verifying access token'
      });
    }
  };

  // Require admin role
  requireAdmin = async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (req.user.role !== 'admin') {
        // Log unauthorized access attempt
        await ActivityLog.create({
          userId: req.user.id,
          action: 'unauthorized_admin_access',
          details: { 
            endpoint: req.path,
            method: req.method,
            userRole: req.user.role 
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking admin permissions'
      });
    }
  };

  // Require admin or manager role
  requireAdminOrManager = async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!['admin', 'manager'].includes(req.user.role)) {
        // Log unauthorized access attempt
        await ActivityLog.create({
          userId: req.user.id,
          action: 'unauthorized_access',
          details: { 
            endpoint: req.path,
            method: req.method,
            userRole: req.user.role,
            requiredRoles: ['admin', 'manager']
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(403).json({
          success: false,
          message: 'Admin or manager access required'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };

  // Log user activity
  logActivity = (action) => {
    return async (req, res, next) => {
      try {
        if (req.user) {
          await ActivityLog.create({
            userId: req.user.id,
            action,
            details: {
              endpoint: req.path,
              method: req.method,
              query: req.query,
              body: req.method === 'GET' ? undefined : req.body
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
        next();
      } catch (error) {
        // Don't fail the request if logging fails
        console.error('Activity logging error:', error);
        next();
      }
    };
  };

  // Rate limiting for sensitive operations
  rateLimitSensitive = () => {
    const attempts = new Map();
    const WINDOW_TIME = 15 * 60 * 1000; // 15 minutes
    const MAX_ATTEMPTS = 10;

    return (req, res, next) => {
      const key = `${req.ip}_${req.user?.id || 'anonymous'}`;
      const now = Date.now();
      
      if (!attempts.has(key)) {
        attempts.set(key, []);
      }

      const userAttempts = attempts.get(key);
      
      // Remove old attempts outside the window
      while (userAttempts.length > 0 && userAttempts[0] < now - WINDOW_TIME) {
        userAttempts.shift();
      }

      if (userAttempts.length >= MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.'
        });
      }

      userAttempts.push(now);
      next();
    };
  };
}

module.exports = new AdminAuthMiddleware();