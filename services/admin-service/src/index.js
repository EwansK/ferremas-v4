require('dotenv').config();
const express = require('express');
const database = require('./utils/database');

// Import shared middleware
const corsMiddleware = require('../shared/middleware/cors');
const authMiddleware = require('../shared/middleware/auth');

// Import routes
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(corsMiddleware.getMiddleware());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'admin-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes (all routes require admin role)
app.use('/users', authMiddleware.requireAdmin(), userRoutes);
app.use('/employees', authMiddleware.requireAdmin(), employeeRoutes);
app.use('/analytics', authMiddleware.requireAdmin(), analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ferremas Admin Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/users',
      employees: '/employees',
      analytics: '/analytics'
    },
    documentation: 'https://docs.ferremas.com/admin-api'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`👋 ${signal} received, shutting down gracefully`);
  
  try {
    await database.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    // Connect to database
    try {
      await database.connect();
      console.log('✅ Database connection established successfully');
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, service will start without it:', dbError.message);
    }
    
    app.listen(PORT, () => {
      console.log(`👤 =====================================`);
      console.log(`👤 Ferremas Admin Service Started`);
      console.log(`👤 =====================================`);
      console.log(`🌐 Admin service running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Admin dashboard: http://localhost:${PORT}/analytics/dashboard`);
      console.log(`👥 User management: http://localhost:${PORT}/users`);
      console.log(`👤 Employee management: http://localhost:${PORT}/employees`);
      console.log(`📈 Analytics: http://localhost:${PORT}/analytics`);
      console.log(`👤 =====================================`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'missing'}`);
      console.log(`💾 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ferremas'}`);
      console.log(`👤 =====================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start admin service:', error);
    process.exit(1);
  }
}

startServer();