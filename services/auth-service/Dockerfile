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

# Expose the port
EXPOSE 3001

# Start the service  
CMD ["npm", "start"]