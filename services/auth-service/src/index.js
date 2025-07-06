require('dotenv').config();
const express = require('express');

// Import shared middleware
const corsMiddleware = require('../shared/middleware/cors');

const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const jwtUtils = require('./utils/jwt');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(corsMiddleware.getAuthMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: '1.0.0'
  });
});

// API routes
app.use('/auth', authRoutes);

// 404 handler
app.use('*', errorHandler.notFound);

// Global error handler
app.use(errorHandler.handle);

// Cleanup function for expired tokens
const startTokenCleanup = () => {
  // Clean up expired tokens every hour
  setInterval(async () => {
    try {
      const count = await jwtUtils.cleanupExpiredTokens();
      if (count > 0) {
        console.log(`Cleaned up ${count} expired tokens`);
      }
    } catch (error) {
      console.error('Error during token cleanup:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
};

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth service running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
  
  // Start token cleanup
  startTokenCleanup();
  console.log('🧹 Token cleanup scheduled');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;