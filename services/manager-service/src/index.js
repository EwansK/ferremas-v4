require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');

// Import shared middleware
const corsMiddleware = require('../shared/middleware/cors');
const authMiddleware = require('../shared/middleware/auth');

const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(corsMiddleware.getMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Manager service is running',
    timestamp: new Date().toISOString(),
    service: 'manager-service',
    version: '1.0.0'
  });
});

// API routes (all routes require manager or admin role)
app.use('/products', authMiddleware.authenticate, authMiddleware.authorize(['manager', 'admin']), productRoutes);
app.use('/categories', authMiddleware.authenticate, authMiddleware.authorize(['manager', 'admin']), categoryRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);

  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${Math.round(process.env.MAX_FILE_SIZE / 1024 / 1024)}MB`
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
  }

  // Handle custom file upload errors
  if (error.message && error.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details
    });
  }

  // Handle database errors
  if (error.code === '22P02') { // Invalid UUID format
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      message: 'Cannot delete item due to existing references'
    });
  }

  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      message: 'Item with this name already exists'
    });
  }

  // Handle auth service connection errors
  if (error.code === 'ECONNREFUSED' && error.message.includes('3001')) {
    return res.status(503).json({
      success: false,
      message: 'Authentication service unavailable'
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Manager service running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Products API: http://localhost:${PORT}/products`);
  console.log(`🏷️  Categories API: http://localhost:${PORT}/categories`);
  console.log(`🖼️  Images served from: http://localhost:${PORT}/uploads`);
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