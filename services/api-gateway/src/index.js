require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import middleware
const securityMiddleware = require('./middleware/security');
const loggingMiddleware = require('./middleware/logging');
const proxyMiddleware = require('./middleware/proxy');

// Import shared middleware
const corsMiddleware = require('../shared/middleware/cors');
const authMiddleware = require('../shared/middleware/auth');

// Import routes
const healthRoutes = require('./routes/healthRoutes');

// Import utilities
const serviceRegistry = require('./utils/serviceRegistry');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Security headers
app.use(securityMiddleware.applySecurityHeaders());

// CORS configuration
app.use(corsMiddleware.getMiddleware());

// Request context and logging
app.use(loggingMiddleware.addRequestContext);
app.use(loggingMiddleware.getRequestLogger());

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request validation
app.use(securityMiddleware.validateRequest);

// API key validation (optional)
app.use(securityMiddleware.validateApiKey);

// =============================================================================
// ROUTES
// =============================================================================

// Health check routes
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ferremas API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: {
      health: '/health',
      systemHealth: '/health/system',
      stats: '/health/stats'
    },
    services: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories', 
      manager: '/api/manager',
      admin: '/api/admin',
      cart: '/api/cart'
    }
  });
});

// API routes with rate limiting and authentication
app.use('/api/auth', securityMiddleware.applyAuthRateLimit());
app.use('/api/products', securityMiddleware.applyProductRateLimit());
app.use('/api/categories', securityMiddleware.applyProductRateLimit());

// Protected routes - require authentication
app.use('/api/manager', securityMiddleware.applyGeneralRateLimit(), authMiddleware.authenticate, authMiddleware.authorize(['manager', 'admin']));
app.use('/api/admin', securityMiddleware.applyGeneralRateLimit(), authMiddleware.authenticate, authMiddleware.authorize(['admin']));
app.use('/api/cart', securityMiddleware.applyGeneralRateLimit(), authMiddleware.authenticate);

// Temporary manual auth route (bypass proxy issues)
app.post('/api/auth/login', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.post('http://auth-service:3001/auth/login', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Source': 'api-gateway'
      },
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Manual auth proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication service unavailable'
      });
    }
  }
});

// Main proxy routing (must be after specific routes)
app.use('/api', proxyMiddleware.routeRequest);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/health - Gateway health check',
      '/health/system - System-wide health check',
      '/health/stats - Gateway statistics',
      '/api/auth/* - Authentication service',
      '/api/products/* - Product service',
      '/api/categories/* - Category service',
      '/api/manager/* - Manager service',
      '/api/admin/* - Admin service',
      '/api/cart/* - Cart service'
    ]
  });
});

// Error logging middleware
app.use(loggingMiddleware.logError);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Handle CORS errors
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: 'Origin not allowed'
    });
  }

  // Handle rate limit errors
  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: error.retryAfter || 60
    });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body'
    });
  }

  // Handle proxy errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: {
        code: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId || 'unknown'
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close service registry connections
    console.log('🔌 Closing service registry...');
    
    // Exit process
    process.exit(0);
  });
  
  // Force exit after timeout
  setTimeout(() => {
    console.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log('\n🚀 =====================================');
  console.log('🚀 Ferremas API Gateway Started');
  console.log('🚀 =====================================');
  console.log(`🌐 Gateway running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 System health: http://localhost:${PORT}/health/system`);
  console.log(`📈 Statistics: http://localhost:${PORT}/health/stats`);
  console.log('🚀 =====================================');
  console.log('📡 Service Endpoints:');
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`🏷️  Categories: http://localhost:${PORT}/api/categories`);
  console.log(`👔 Manager: http://localhost:${PORT}/api/manager`);
  console.log(`👨‍💼 Admin: http://localhost:${PORT}/api/admin`);
  console.log(`🛒 Cart: http://localhost:${PORT}/api/cart`);
  console.log('🚀 =====================================\n');
  
  // Display registered services
  const services = serviceRegistry.getAllServices();
  console.log(`📋 Registered Services (${services.length}):`);
  services.forEach(service => {
    console.log(`   • ${service.name}: ${service.status} - ${service.url}`);
  });
  console.log('');
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;