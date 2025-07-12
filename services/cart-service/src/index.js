require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const database = require('./utils/database');
const cartRoutes = require('./routes/cartRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 3005;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Security middleware
app.use(helmet());
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/', healthRoutes);
app.use('/cart', cartRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ferremas Cart Service API',
    data: {
      service: 'cart-service',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        cart: '/cart',
        documentation: 'See README.md for API documentation'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      path: req.path,
      method: req.method
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      stack: error.stack
    } : {
      code: 'INTERNAL_ERROR'
    }
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();
    
    // Start HTTP server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🛒 =====================================');
      console.log('🛒 FERREMAS CART SERVICE STARTED');
      console.log('🛒 =====================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🛒 Cart API: http://localhost:${PORT}/cart`);
      console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'using fallback'}`);
      console.log(`💾 Database: ${process.env.DATABASE_URL ? 'configured' : 'using local config'}`);
      console.log('🛒 =====================================');
    });
  } catch (error) {
    console.error('❌ Failed to start cart service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;