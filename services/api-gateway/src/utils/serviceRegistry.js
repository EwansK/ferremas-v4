const axios = require('axios');

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000;
    this.healthCheckTimeout = parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000;
    this.initServices();
  }

  initServices() {
    // Register all microservices
    this.registerService('auth', {
      name: 'auth-service',
      url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      healthPath: '/health',
      status: 'unknown',
      lastCheck: null
    });

    this.registerService('products', {
      name: 'product-service', 
      url: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
      healthPath: '/health',
      status: 'unknown',
      lastCheck: null
    });

    this.registerService('manager', {
      name: 'manager-service',
      url: process.env.MANAGER_SERVICE_URL || 'http://manager-service:3003', 
      healthPath: '/health',
      status: 'unknown',
      lastCheck: null
    });

    this.registerService('admin', {
      name: 'admin-service',
      url: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3004',
      healthPath: '/health', 
      status: 'unknown',
      lastCheck: null
    });

    // Cart service commented out until implemented
    // this.registerService('cart', {
    //   name: 'cart-service',
    //   url: process.env.CART_SERVICE_URL || 'http://cart-service:3005',
    //   healthPath: '/health',
    //   status: 'unknown', 
    //   lastCheck: null
    // });

    // Start health checks
    this.startHealthChecks();
  }

  registerService(key, serviceConfig) {
    this.services.set(key, {
      ...serviceConfig,
      registeredAt: new Date()
    });
    console.log(`📋 Registered service: ${serviceConfig.name} at ${serviceConfig.url}`);
  }

  getService(key) {
    return this.services.get(key);
  }

  getAllServices() {
    return Array.from(this.services.entries()).map(([key, service]) => ({
      key,
      ...service
    }));
  }

  getHealthyServices() {
    return this.getAllServices().filter(service => service.status === 'healthy');
  }

  async checkServiceHealth(service) {
    try {
      const response = await axios.get(
        `${service.url}${service.healthPath}`,
        { 
          timeout: this.healthCheckTimeout,
          validateStatus: (status) => status === 200
        }
      );

      const isHealthy = response.data && response.data.success === true;
      
      service.status = isHealthy ? 'healthy' : 'unhealthy';
      service.lastCheck = new Date();
      service.lastError = null;

      if (isHealthy) {
        service.responseTime = response.headers['x-response-time'] || 'N/A';
        service.version = response.data.version || 'N/A';
      }

      return isHealthy;
    } catch (error) {
      service.status = 'unhealthy';
      service.lastCheck = new Date();
      service.lastError = {
        message: error.message,
        code: error.code,
        timestamp: new Date()
      };
      
      console.warn(`⚠️ Health check failed for ${service.name}: ${error.message}`);
      return false;
    }
  }

  async checkAllServicesHealth() {
    const services = Array.from(this.services.values());
    const healthChecks = services.map(service => this.checkServiceHealth(service));
    
    const results = await Promise.allSettled(healthChecks);
    
    let healthyCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        healthyCount++;
      }
    });

    console.log(`🔍 Health check completed: ${healthyCount}/${services.length} services healthy`);
    return { total: services.length, healthy: healthyCount };
  }

  startHealthChecks() {
    console.log(`🏥 Starting health checks every ${this.healthCheckInterval}ms`);
    
    // Initial health check
    this.checkAllServicesHealth();
    
    // Periodic health checks
    setInterval(() => {
      this.checkAllServicesHealth();
    }, this.healthCheckInterval);
  }

  // Get service URL with load balancing (future enhancement)
  getServiceUrl(serviceKey) {
    const service = this.getService(serviceKey);
    if (!service) {
      throw new Error(`Service ${serviceKey} not found`);
    }
    
    if (service.status !== 'healthy') {
      console.warn(`⚠️ Service ${serviceKey} is not healthy but routing anyway`);
    }
    
    return service.url;
  }

  // Route path mapping
  getRouteMapping() {
    return {
      // Authentication routes
      '/api/auth': 'auth',
      
      // Public product routes (no auth required)
      '/api/products': 'products',
      '/api/categories': 'products',
      
      // Manager routes (auth required)
      '/api/manager': 'manager',
      
      // Admin routes (auth required) 
      '/api/admin': 'admin'
      
      // Cart routes (auth required) - disabled until cart service is implemented
      // '/api/cart': 'cart'
    };
  }

  // Find service for a given path
  findServiceForPath(path) {
    const routes = this.getRouteMapping();
    
    for (const [routePrefix, serviceKey] of Object.entries(routes)) {
      if (path.startsWith(routePrefix)) {
        return {
          serviceKey,
          service: this.getService(serviceKey),
          routePrefix
        };
      }
    }
    
    return null;
  }
}

module.exports = new ServiceRegistry();