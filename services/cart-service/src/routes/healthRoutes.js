const express = require('express');
const database = require('../utils/database');

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await database.query('SELECT 1');
    
    res.json({
      success: true,
      message: 'Cart service is healthy',
      data: {
        service: 'cart-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: 'connected'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Cart service is unhealthy',
      data: {
        service: 'cart-service',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected'
      }
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const checks = {
    database: false,
    memory: false,
    uptime: true
  };

  try {
    // Database check
    await database.query('SELECT COUNT(*) FROM cart_items');
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memThreshold = 500 * 1024 * 1024; // 500MB
  checks.memory = memUsage.heapUsed < memThreshold;

  const allHealthy = Object.values(checks).every(check => check);

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    message: allHealthy ? 'All systems healthy' : 'Some systems unhealthy',
    data: {
      service: 'cart-service',
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      metrics: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        environment: process.env.NODE_ENV || 'development'
      }
    }
  });
});

module.exports = router;