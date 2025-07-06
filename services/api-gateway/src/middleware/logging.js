const morgan = require('morgan');

class LoggingMiddleware {
  constructor() {
    this.setupLogging();
  }

  setupLogging() {
    // Custom token for correlation ID
    morgan.token('correlation-id', (req) => {
      return req.headers['x-correlation-id'] || req.requestId || 'unknown';
    });

    // Custom token for user ID
    morgan.token('user-id', (req) => {
      return req.user?.id || 'anonymous';
    });

    // Custom token for user role
    morgan.token('user-role', (req) => {
      return req.user?.role || 'guest';
    });

    // Custom token for request body size
    morgan.token('req-size', (req) => {
      return req.headers['content-length'] || '0';
    });

    // Custom token for response time in milliseconds
    morgan.token('response-time-ms', (req, res) => {
      if (!req._startAt || !res._startAt) {
        return '';
      }
      
      const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
                 (res._startAt[1] - req._startAt[1]) * 1e-6;
      return ms.toFixed(3);
    });

    // Development format (colorized and detailed)
    this.developmentFormat = morgan((tokens, req, res) => {
      const status = tokens.status(req, res);
      const method = tokens.method(req, res);
      const url = tokens.url(req, res);
      const responseTime = tokens['response-time-ms'](req, res);
      const correlationId = tokens['correlation-id'](req, res);
      const userInfo = tokens['user-id'](req, res);
      
      // Color coding based on status
      let statusColor = '\x1b[32m'; // Green
      if (status >= 400 && status < 500) statusColor = '\x1b[33m'; // Yellow
      if (status >= 500) statusColor = '\x1b[31m'; // Red
      
      return [
        '\x1b[36m[API-GW]\x1b[0m', // Cyan
        `${statusColor}${status}\x1b[0m`,
        `\x1b[35m${method}\x1b[0m`, // Magenta
        url,
        `\x1b[90m${responseTime}ms\x1b[0m`, // Gray
        `\x1b[90m[${correlationId}]\x1b[0m`, // Gray
        userInfo !== 'anonymous' ? `\x1b[90m(${userInfo})\x1b[0m` : ''
      ].filter(Boolean).join(' ');
    });

    // Production format (JSON structured logging)
    this.productionFormat = morgan((tokens, req, res) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: 'api-gateway',
        level: 'info',
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: parseInt(tokens.status(req, res)),
        responseTime: parseFloat(tokens['response-time-ms'](req, res)),
        correlationId: tokens['correlation-id'](req, res),
        userAgent: tokens['user-agent'](req, res),
        remoteAddr: tokens['remote-addr'](req, res),
        userId: tokens['user-id'](req, res),
        userRole: tokens['user-role'](req, res),
        requestSize: parseInt(tokens['req-size'](req, res)),
        responseSize: parseInt(tokens.res(req, res, 'content-length') || '0')
      };

      return JSON.stringify(logEntry);
    });

    // Error logging format
    this.errorFormat = morgan((tokens, req, res) => {
      const status = parseInt(tokens.status(req, res));
      
      // Only log errors (4xx and 5xx)
      if (status < 400) return null;
      
      const errorLog = {
        timestamp: new Date().toISOString(),
        service: 'api-gateway',
        level: status >= 500 ? 'error' : 'warn',
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: status,
        responseTime: parseFloat(tokens['response-time-ms'](req, res)),
        correlationId: tokens['correlation-id'](req, res),
        userAgent: tokens['user-agent'](req, res),
        remoteAddr: tokens['remote-addr'](req, res),
        userId: tokens['user-id'](req, res),
        error: {
          message: res.locals.errorMessage || 'Unknown error',
          stack: res.locals.errorStack || null
        }
      };

      return JSON.stringify(errorLog);
    });
  }

  // Get appropriate logger based on environment
  getRequestLogger() {
    const env = process.env.NODE_ENV;
    const logRequests = process.env.LOG_REQUESTS !== 'false';
    
    if (!logRequests) {
      return (req, res, next) => next(); // No-op middleware
    }

    if (env === 'production') {
      return this.productionFormat;
    } else {
      return this.developmentFormat;
    }
  }

  // Error logger
  getErrorLogger() {
    return this.errorFormat;
  }

  // Request context middleware
  addRequestContext = (req, res, next) => {
    // Add start time for response time calculation
    req._startAt = process.hrtime();
    
    // Add request ID if not present
    if (!req.requestId) {
      req.requestId = req.headers['x-request-id'] || 
                     `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add correlation ID
    const correlationId = req.headers['x-correlation-id'] || req.requestId;
    req.correlationId = correlationId;
    
    // Set response header
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
  };

  // Custom error logging middleware
  logError = (error, req, res, next) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      level: 'error',
      correlationId: req.correlationId || 'unknown',
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.headers['user-agent'],
      remoteAddr: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code || 'UNKNOWN_ERROR'
      }
    };

    // Store error info in response locals for morgan
    res.locals.errorMessage = error.message;
    res.locals.errorStack = error.stack;

    // Log to console (in production, this would go to a logging service)
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(errorLog));
    } else {
      console.error(`\x1b[31m[ERROR]\x1b[0m ${error.message}`);
      console.error(error.stack);
    }

    next(error);
  };

  // Log service proxy events
  logProxyEvent = (event, req, service, details = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      level: 'info',
      event: event,
      correlationId: req.correlationId || 'unknown',
      method: req.method,
      url: req.originalUrl || req.url,
      targetService: service?.name || 'unknown',
      targetUrl: service?.url || 'unknown',
      userId: req.user?.id || 'anonymous',
      details: details
    };

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`\x1b[34m[PROXY]\x1b[0m ${event} - ${req.method} ${req.originalUrl} → ${service?.name}`);
    }
  };
}

module.exports = new LoggingMiddleware();