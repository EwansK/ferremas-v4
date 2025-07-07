# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "development" ] ; then npm ci ; else npm ci --only=production ; fi

# Copy source code and shared middleware
COPY src/ ./src/
COPY shared/ ./shared/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 3004, path: '/health', timeout: 2000 }; \
    const req = http.get(options, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); \
    req.on('error', () => process.exit(1));"

# Start the service
CMD ["node", "src/index.js"]