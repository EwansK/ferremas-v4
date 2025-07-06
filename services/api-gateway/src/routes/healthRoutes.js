const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// Gateway health check
router.get('/', healthController.getGatewayHealth);

// System-wide health check (all services)
router.get('/system', healthController.getSystemHealth);

// Individual service health check
router.get('/service/:serviceName', healthController.getServiceInfo);

// Gateway statistics
router.get('/stats', healthController.getGatewayStats);

// Manual service registry refresh
router.post('/refresh', healthController.refreshServices);

module.exports = router;