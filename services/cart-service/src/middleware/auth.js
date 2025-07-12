const jwt = require('jsonwebtoken');
const axios = require('axios');

class AuthMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    this.useServiceVerification = process.env.USE_SERVICE_AUTH === 'true';
  }

  // Local JWT verification
  verifyTokenLocal(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return { success: true, user: decoded };
    } catch (error) {
      return { 
        success: false, 
        error: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' 
      };
    }
  }

  // Service-based verification
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

      if (response.data.success) {
        return { success: true, user: response.data.data.user };
      }
      
      return { success: false, error: 'Token verification failed' };
    } catch (error) {
      console.error('Auth service verification failed:', error.message);
      return { success: false, error: 'Authentication service unavailable' };
    }
  }

  // Main authentication middleware
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

      const token = authHeader.substring(7);
      
      let verificationResult;
      
      if (this.useServiceVerification) {
        verificationResult = await this.verifyTokenService(token);
      } else {
        verificationResult = this.verifyTokenLocal(token);
      }

      if (!verificationResult.success) {
        return res.status(401).json({
          success: false,
          message: verificationResult.error || 'Invalid token',
          error: { code: 'INVALID_TOKEN' }
        });
      }

      // Attach user to request
      req.user = verificationResult.user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication service error',
        error: { code: 'AUTH_SERVICE_ERROR' }
      });
    }
  };

  // Optional authentication (for guest cart operations)
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No auth provided, continue as guest
        req.user = null;
        return next();
      }

      const token = authHeader.substring(7);
      
      let verificationResult;
      
      if (this.useServiceVerification) {
        verificationResult = await this.verifyTokenService(token);
      } else {
        verificationResult = this.verifyTokenLocal(token);
      }

      if (verificationResult.success) {
        req.user = verificationResult.user;
      } else {
        req.user = null;
      }

      next();
    } catch (error) {
      console.error('Optional auth error:', error);
      req.user = null;
      next();
    }
  };

  // Require specific role
  requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: { code: 'AUTHENTICATION_REQUIRED' }
        });
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

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
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

module.exports = authMiddleware;