const jwtUtils = require('../utils/jwt');
const { Pool } = require('pg');

class AuthMiddleware {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  // Middleware to verify JWT access token
  verifyToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
      }

      const token = jwtUtils.extractTokenFromHeader(authHeader);
      const decoded = jwtUtils.verifyAccessToken(token);

      // Get user details from database to ensure user still exists and is active
      const userResult = await this.pool.query(
        'SELECT id, email, name, lastname, role_id, active FROM users WHERE id = $1',
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
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token'
      });
    }
  };

  // Middleware to check if user has specific role
  requireRole = (roleNames) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Get user's role name
        const roleResult = await this.pool.query(
          'SELECT role_name FROM roles WHERE id = $1',
          [req.user.role_id]
        );

        if (roleResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Invalid user role'
          });
        }

        const userRole = roleResult.rows[0].role_name;

        // Check if user's role is in the allowed roles
        const allowedRoles = Array.isArray(roleNames) ? roleNames : [roleNames];
        
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          });
        }

        // Add role to request object
        req.user.role_name = userRole;
        next();

      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error checking user permissions'
        });
      }
    };
  };

  // Middleware to check if user is admin
  requireAdmin = () => {
    return this.requireRole(['admin']);
  };

  // Middleware to check if user is manager or admin
  requireManagerOrAdmin = () => {
    return this.requireRole(['manager', 'admin']);
  };

  // Optional authentication - doesn't fail if no token provided
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        req.user = null;
        return next();
      }

      const token = jwtUtils.extractTokenFromHeader(authHeader);
      const decoded = jwtUtils.verifyAccessToken(token);

      // Get user details from database
      const userResult = await this.pool.query(
        'SELECT id, email, name, lastname, role_id, active FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].active) {
        req.user = null;
      } else {
        req.user = userResult.rows[0];
      }

      next();

    } catch (error) {
      // If token is invalid, just continue without user
      req.user = null;
      next();
    }
  };
}

module.exports = new AuthMiddleware();