const { createProxyMiddleware } = require('http-proxy-middleware');
const serviceRegistry = require('../utils/serviceRegistry');

class ProxyMiddleware {
  constructor() {
    this.proxies = new Map();
    this.setupProxies();
  }

  setupProxies() {
    const services = serviceRegistry.getAllServices();
    
    services.forEach(service => {
      const proxyOptions = {
        target: service.url,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        secure: false,
        followRedirects: false,
        selfHandleResponse: false,
        ignorePath: false,
        
        // Simplified path rewriting with better error handling
        pathRewrite: {
          '^/api/auth': '/auth',
          '^/api/products': '/products', 
          '^/api/categories': '/categories',
          '^/api/manager': '',
          '^/api/admin': '',
          '^/api/cart': ''
        },

        // Request logging and modification
        onProxyReq: (proxyReq, req, res) => {
          const startTime = Date.now();
          req.proxyStartTime = startTime;
          
          console.log(`🔄 [${new Date().toISOString()}] Proxying ${req.method} ${req.originalUrl} → ${service.url}`);
          
          // Add correlation ID for tracing
          const correlationId = req.headers['x-correlation-id'] || 
                               `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          proxyReq.setHeader('X-Correlation-ID', correlationId);
          
          // Add gateway identification
          proxyReq.setHeader('X-Gateway-Source', 'api-gateway');
          proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());
          
          // Handle request body for POST/PUT requests
          if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        },

        // Response logging and modification
        onProxyRes: (proxyRes, req, res) => {
          const endTime = Date.now();
          const duration = endTime - (req.proxyStartTime || endTime);
          
          console.log(`✅ [${new Date().toISOString()}] Response ${req.method} ${req.originalUrl} - ${proxyRes.statusCode} (${duration}ms)`);
          
          // Add response headers
          proxyRes.headers['X-Gateway-Response-Time'] = `${duration}ms`;
          proxyRes.headers['X-Service-Name'] = service.name;
          
          // CORS headers (if not already set by service)
          if (!proxyRes.headers['access-control-allow-origin']) {
            proxyRes.headers['access-control-allow-origin'] = '*';
          }
        },

        // Error handling
        onError: (err, req, res) => {
          console.error(`❌ Proxy error for ${req.method} ${req.originalUrl}:`, err.message);
          console.error('Error details:', {
            code: err.code,
            errno: err.errno,
            syscall: err.syscall,
            hostname: err.hostname,
            port: err.port
          });
          
          // Update service health status
          const serviceInfo = serviceRegistry.findServiceForPath(req.originalUrl);
          if (serviceInfo && serviceInfo.service) {
            serviceInfo.service.status = 'unhealthy';
            serviceInfo.service.lastError = {
              message: err.message,
              code: err.code,
              timestamp: new Date(),
              request: `${req.method} ${req.originalUrl}`
            };
          }
          
          // Send error response
          if (!res.headersSent) {
            let errorMessage = 'Service temporarily unavailable';
            let statusCode = 503;
            
            if (err.code === 'ECONNREFUSED') {
              errorMessage = 'Service connection refused';
            } else if (err.code === 'ETIMEDOUT') {
              errorMessage = 'Service request timeout';
              statusCode = 504;
            } else if (err.code === 'ECONNRESET') {
              errorMessage = 'Service connection reset';
            }
            
            res.status(statusCode).json({
              success: false,
              message: errorMessage,
              error: {
                code: err.code || 'SERVICE_UNAVAILABLE',
                service: service.name,
                timestamp: new Date().toISOString()
              }
            });
          }
        }
      };

      this.proxies.set(service.key, createProxyMiddleware(proxyOptions));
    });
  }

  // Main routing middleware
  routeRequest = (req, res, next) => {
    const path = req.originalUrl || req.url;
    const serviceInfo = serviceRegistry.findServiceForPath(path);
    
    if (!serviceInfo) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
        path: path,
        availableRoutes: Object.keys(serviceRegistry.getRouteMapping())
      });
    }

    const { serviceKey, service, routePrefix } = serviceInfo;
    
    if (!service) {
      return res.status(503).json({
        success: false,
        message: 'Service not available',
        service: serviceKey
      });
    }

    // Check if service is healthy
    if (service.status === 'unhealthy') {
      console.warn(`⚠️ Routing to unhealthy service: ${service.name}`);
    }

    // Get the appropriate proxy
    const proxy = this.proxies.get(serviceKey);
    if (!proxy) {
      return res.status(500).json({
        success: false,
        message: 'Proxy not configured for service',
        service: serviceKey
      });
    }

    // Apply the proxy
    proxy(req, res, next);
  };

  // Get proxy for specific service (for manual use)
  getProxy(serviceKey) {
    return this.proxies.get(serviceKey);
  }

  // Refresh proxies (useful for dynamic service discovery)
  refreshProxies() {
    console.log('🔄 Refreshing proxy configurations...');
    this.proxies.clear();
    this.setupProxies();
  }
}

module.exports = new ProxyMiddleware();