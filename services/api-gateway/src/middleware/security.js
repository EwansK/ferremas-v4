const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

class SecurityMiddleware {
  constructor() {
    this.setupRateLimiting();
    this.setupSecurity();
  }

  setupRateLimiting() {
    // General rate limiting
    this.generalLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      keyGenerator: (req) => {
        // Use IP address as the key
        return req.ip || req.connection.remoteAddress;
      },
      handler: (req, res) => {
        console.warn(`🚫 Rate limit exceeded for IP: ${req.ip} - ${req.method} ${req.originalUrl}`);
        res.status(429).json({
          success: false,
          message: 'Too many requests from this IP, please try again later',
          retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
        });
      }
    });

    // Stricter rate limiting for auth endpoints
    this.authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
      message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
        retryAfter: 900 // 15 minutes
      },
      skipSuccessfulRequests: true // Don't count successful auth requests
    });

    // More lenient rate limiting for product browsing
    this.productLimiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // limit each IP to 60 requests per minute for product browsing
      message: {
        success: false,
        message: 'Too many product requests, please slow down',
        retryAfter: 60
      }
    });
  }

  setupSecurity() {
    // Helmet configuration for security headers
    this.helmetConfig = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for API compatibility
      crossOriginResourcePolicy: { policy: "cross-origin" }
    });
  }

  // Apply general rate limiting
  applyGeneralRateLimit() {
    return this.generalLimiter;
  }

  // Apply auth-specific rate limiting
  applyAuthRateLimit() {
    return this.authLimiter;
  }

  // Apply product-specific rate limiting
  applyProductRateLimit() {
    return this.productLimiter;
  }

  // Apply security headers
  applySecurityHeaders() {
    return this.helmetConfig;
  }

  // CORS configuration
  getCorsConfig() {
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['http://localhost:3000', 'http://localhost:3001'];

    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`🚫 CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Correlation-ID'
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Gateway-Response-Time',
        'X-Service-Name'
      ]
    };
  }

  // API Key validation middleware (optional)
  validateApiKey = (req, res, next) => {
    const apiKey = req.headers[process.env.API_KEY_HEADER?.toLowerCase() || 'x-api-key'];
    const validApiKey = process.env.API_KEY;

    // Skip API key validation if not configured
    if (!validApiKey) {
      return next();
    }

    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing API key'
      });
    }

    next();
  };

  // Request validation middleware
  validateRequest = (req, res, next) => {
    // Check for required headers
    const contentType = req.headers['content-type'];
    
    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid content type. Expected application/json or multipart/form-data'
        });
      }
    }

    // Add request ID for tracing
    req.requestId = req.headers['x-request-id'] || 
                   `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    next();
  };

  // Apply rate limiting based on path
  applyPathBasedRateLimit = (req, res, next) => {
    const path = req.originalUrl || req.url;
    
    if (path.startsWith('/api/auth')) {
      return this.authLimiter(req, res, next);
    } else if (path.startsWith('/api/products') || path.startsWith('/api/categories')) {
      return this.productLimiter(req, res, next);
    } else {
      return this.generalLimiter(req, res, next);
    }
  };
}

module.exports = new SecurityMiddleware();