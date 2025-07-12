# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies based on environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "$NODE_ENV" = "development" ] ; then npm ci ; else npm ci --only=production ; fi

# Copy source code
COPY src/ ./src/

# Set ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
  const options = { hostname: 'localhost', port: 3005, path: '/health', timeout: 2000 }; \
  const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }); \
  req.on('error', () => process.exit(1)); \
  req.end();"

# Start the service
CMD ["node", "src/index.js"]