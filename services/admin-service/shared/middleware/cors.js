const cors = require('cors');

/**
 * Shared CORS configuration for all microservices
 * Provides consistent CORS policies across the system
 */

class CorsMiddleware {
  constructor() {
    this.allowedOrigins = this.parseAllowedOrigins();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Parse allowed origins from environment variable
   */
  parseAllowedOrigins() {
    const defaultOrigins = [
      'http://localhost:3000',  // API Gateway
      'http://localhost:3001',  // Frontend
      'http://localhost:3005',  // Auth Service (external port)
    ];

    if (process.env.CORS_ORIGIN) {
      // Support both single origin and comma-separated list
      const origins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
      return origins.length > 0 ? origins : defaultOrigins;
    }

    return defaultOrigins;
  }

  /**
   * Development CORS configuration (more permissive)
   */
  getDevelopmentConfig() {
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Allow localhost on any port for development
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }

        // Check against allowed origins
        if (this.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        console.warn(`CORS: Blocked origin ${origin} in development mode`);
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-User-ID',
        'X-User-Role',
        'X-User-Email',
        'X-Correlation-ID',
        'X-Gateway-Source',
        'X-Gateway-Timestamp'
      ],
      exposedHeaders: [
        'X-Gateway-Response-Time',
        'X-Service-Name',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ],
      maxAge: 86400 // 24 hours
    };
  }

  /**
   * Production CORS configuration (more restrictive)
   */
  getProductionConfig() {
    return {
      origin: (origin, callback) => {
        // Always allow same-origin requests
        if (!origin) return callback(null, true);

        if (this.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        console.error(`CORS: Blocked unauthorized origin ${origin} in production`);
        callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-User-ID',
        'X-User-Role',
        'X-User-Email',
        'X-Correlation-ID'
      ],
      exposedHeaders: [
        'X-Gateway-Response-Time',
        'X-Service-Name'
      ],
      maxAge: 3600 // 1 hour
    };
  }

  /**
   * Get CORS middleware based on environment
   */
  getMiddleware() {
    const config = this.isDevelopment ? 
      this.getDevelopmentConfig() : 
      this.getProductionConfig();

    console.log(`🔒 CORS configured for ${this.isDevelopment ? 'development' : 'production'}`);
    console.log(`🔒 Allowed origins:`, this.allowedOrigins);

    return cors(config);
  }

  /**
   * Public API CORS (for product service, etc.)
   */
  getPublicMiddleware() {
    return cors({
      origin: this.isDevelopment ? true : this.allowedOrigins,
      credentials: false,
      methods: ['GET', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept'
      ],
      maxAge: this.isDevelopment ? 86400 : 3600
    });
  }

  /**
   * Auth service specific CORS (handles login/register)
   */
  getAuthMiddleware() {
    const config = this.isDevelopment ? 
      this.getDevelopmentConfig() : 
      this.getProductionConfig();

    // Auth service needs to accept credentials for login/register
    config.credentials = true;

    return cors(config);
  }

  /**
   * Manual CORS headers (for custom implementations)
   */
  setHeaders(res, origin) {
    if (this.isDevelopment || this.allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    }
  }
}

module.exports = new CorsMiddleware();