# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and shared middleware
COPY src/ ./src/
COPY shared/ ./shared/

# Create uploads directory and set permissions
RUN mkdir -p uploads/products && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose the port
EXPOSE 3003

# Create volume for persistent file storage
VOLUME ["/app/uploads"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 3003, path: '/health', timeout: 2000 }; \
    const req = http.get(options, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); \
    req.on('error', () => process.exit(1));"

# Start the service
CMD ["node", "src/index.js"]