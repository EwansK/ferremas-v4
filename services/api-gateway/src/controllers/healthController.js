const serviceRegistry = require('../utils/serviceRegistry');

class HealthController {
  // Gateway health check
  getGatewayHealth = async (req, res) => {
    try {
      const gatewayHealth = {
        service: 'api-gateway',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      };

      res.json({
        success: true,
        data: gatewayHealth
      });
    } catch (error) {
      console.error('Gateway health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Gateway health check failed'
      });
    }
  };

  // Aggregate health check of all services
  getSystemHealth = async (req, res) => {
    try {
      const healthCheckResult = await serviceRegistry.checkAllServicesHealth();
      const services = serviceRegistry.getAllServices();
      
      const systemHealth = {
        gateway: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        },
        services: services.map(service => ({
          name: service.name,
          status: service.status,
          url: service.url,
          lastCheck: service.lastCheck,
          responseTime: service.responseTime || 'N/A',
          version: service.version || 'N/A',
          lastError: service.lastError || null
        })),
        summary: {
          total: healthCheckResult.total,
          healthy: healthCheckResult.healthy,
          unhealthy: healthCheckResult.total - healthCheckResult.healthy,
          overallStatus: healthCheckResult.healthy === healthCheckResult.total ? 'healthy' : 'degraded'
        }
      };

      const statusCode = systemHealth.summary.overallStatus === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        success: systemHealth.summary.overallStatus === 'healthy',
        data: systemHealth
      });
    } catch (error) {
      console.error('System health check error:', error);
      res.status(500).json({
        success: false,
        message: 'System health check failed'
      });
    }
  };

  // Get detailed service information
  getServiceInfo = async (req, res) => {
    try {
      const { serviceName } = req.params;
      const service = serviceRegistry.getService(serviceName);
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found',
          availableServices: serviceRegistry.getAllServices().map(s => s.key)
        });
      }

      // Perform real-time health check
      const isHealthy = await serviceRegistry.checkServiceHealth(service);
      
      const serviceInfo = {
        key: serviceName,
        name: service.name,
        url: service.url,
        status: service.status,
        isHealthy,
        lastCheck: service.lastCheck,
        responseTime: service.responseTime || 'N/A',
        version: service.version || 'N/A',
        registeredAt: service.registeredAt,
        lastError: service.lastError || null,
        healthPath: service.healthPath
      };

      res.json({
        success: true,
        data: serviceInfo
      });
    } catch (error) {
      console.error('Service info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get service information'
      });
    }
  };

  // Get gateway statistics
  getGatewayStats = async (req, res) => {
    try {
      const services = serviceRegistry.getAllServices();
      const routes = serviceRegistry.getRouteMapping();
      
      const stats = {
        gateway: {
          version: '1.0.0',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform
        },
        services: {
          total: services.length,
          healthy: services.filter(s => s.status === 'healthy').length,
          unhealthy: services.filter(s => s.status === 'unhealthy').length,
          unknown: services.filter(s => s.status === 'unknown').length
        },
        routes: {
          total: Object.keys(routes).length,
          mapping: routes
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 3000,
          rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || 900000,
          rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || 100
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Gateway stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get gateway statistics'
      });
    }
  };

  // Force refresh service registry
  refreshServices = async (req, res) => {
    try {
      console.log('🔄 Manual service registry refresh requested');
      
      // Refresh service registry
      const healthCheckResult = await serviceRegistry.checkAllServicesHealth();
      
      res.json({
        success: true,
        message: 'Service registry refreshed successfully',
        data: {
          timestamp: new Date().toISOString(),
          healthCheck: healthCheckResult
        }
      });
    } catch (error) {
      console.error('Service refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh service registry'
      });
    }
  };
}

module.exports = new HealthController();