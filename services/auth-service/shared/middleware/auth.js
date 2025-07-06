const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Shared authentication middleware for all microservices
 * Provides consistent JWT token verification across the system
 */

class AuthMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.authServiceUrl = process.env.AUTH_SERVICE_URL;
    this.verificationMethod = process.env.AUTH_VERIFICATION_METHOD || 'local'; // 'local' or 'service'
  }

  /**
   * Verify JWT token locally (recommended for performance)
   */
  verifyTokenLocal(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return { success: true, user: decoded };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
      };
    }
  }

  /**
   * Verify JWT token via auth service (fallback method)
   */
  async verifyTokenService(token) {
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/auth/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      if (response.data && response.data.success) {
        return { success: true, user: response.data.user };
      }

      return { success: false, error: 'Invalid token response from auth service' };
    } catch (error) {
      console.error('Auth service verification failed:', error.message);
      
      // Fallback to local verification if auth service is unavailable
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.warn('Auth service unavailable, falling back to local verification');
        return this.verifyTokenLocal(token);
      }

      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        code: 'AUTH_SERVICE_ERROR'
      };
    }
  }

  /**
   * Main authentication middleware
   */
  authenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token required',
          error: { code: 'MISSING_TOKEN' }
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Choose verification method
      let result;
      if (this.verificationMethod === 'service' && this.authServiceUrl) {
        result = await this.verifyTokenService(token);
      } else {
        result = this.verifyTokenLocal(token);
      }

      if (!result.success) {
        const statusCode = result.code === 'TOKEN_EXPIRED' ? 401 : 401;
        return res.status(statusCode).json({
          success: false,
          message: 'Authentication failed',
          error: { 
            code: result.code || 'INVALID_TOKEN',
            message: result.error
          }
        });
      }

      // Add user information to request
      req.user = result.user;
      req.token = token;

      // Add correlation headers for downstream services
      req.headers['x-user-id'] = result.user.id;
      req.headers['x-user-role'] = result.user.role;
      req.headers['x-user-email'] = result.user.email;

      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication system error',
        error: { code: 'AUTH_SYSTEM_ERROR' }
      });
    }
  };

  /**
   * Role-based authorization middleware
   */
  authorize = (allowedRoles = []) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: { code: 'NOT_AUTHENTICATED' }
        });
      }

      if (allowedRoles.length === 0) {
        return next(); // No role restriction
      }

      const userRole = req.user.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS',
            required: allowedRoles,
            current: userRole
          }
        });
      }

      next();
    };
  };

  /**
   * Optional authentication middleware (doesn't fail if no token)
   */
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without authentication
      }

      const token = authHeader.substring(7);
      
      let result;
      if (this.verificationMethod === 'service' && this.authServiceUrl) {
        result = await this.verifyTokenService(token);
      } else {
        result = this.verifyTokenLocal(token);
      }

      if (result.success) {
        req.user = result.user;
        req.token = token;
        req.headers['x-user-id'] = result.user.id;
        req.headers['x-user-role'] = result.user.role;
        req.headers['x-user-email'] = result.user.email;
      }

      next();
    } catch (error) {
      console.error('Optional authentication error:', error);
      next(); // Continue without authentication on error
    }
  };

  /**
   * Admin-only authorization
   */
  requireAdmin = () => this.authorize(['admin']);

  /**
   * Manager or Admin authorization
   */
  requireManager = () => this.authorize(['manager', 'admin']);

  /**
   * Any authenticated user
   */
  requireAuth = () => this.authenticate;
}

module.exports = new AuthMiddleware();