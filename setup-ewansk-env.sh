#!/bin/bash

# 🔧 EWansK's Environment Setup Script
# Creates production-ready environment files with real values

echo "🔧 Setting up environment for EWansK's Ferremas deployment..."
echo "Environment: staging"
echo "EC2 IP: 54.211.97.52"
echo "RDS: ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create main environment file with real values
echo -e "${BLUE}📝 Creating main environment file (.env)...${NC}"
cat > .env << 'EOF'
# Database Configuration - EWansK's RDS Instance
DATABASE_URL=postgresql://postgres:Conejo1246!!@ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com:5432/ferremas
DB_HOST=ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=ferremas
DB_USER=postgres
DB_PASSWORD=Conejo1246!!
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# JWT Configuration - Staging Environment
JWT_SECRET=ewansk-staging-jwt-secret-key-2024-super-secure-v1
JWT_REFRESH_SECRET=ewansk-staging-refresh-secret-key-2024-ultra-secure-v1

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
MANAGER_SERVICE_PORT=3003
ADMIN_SERVICE_PORT=3004

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration - EWansK's EC2 IP
CORS_ORIGIN=http://54.211.97.52:3001

# Environment Configuration
NODE_ENV=staging
AWS_REGION=us-east-1

# Admin Configuration
ADMIN_EMAIL=ewanskurt@gmail.com

# External API Configuration (if needed later)
EXCHANGE_RATE_API_KEY=your-api-key-here

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined
EOF

# Create frontend environment file
echo -e "${BLUE}🌐 Creating frontend environment file...${NC}"
cat > frontend/.env.local << 'EOF'
# Frontend Configuration - EWansK's EC2 Instance
NEXT_PUBLIC_API_URL=http://54.211.97.52:3000
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_ADMIN_EMAIL=ewanskurt@gmail.com
NEXT_PUBLIC_APP_NAME=Ferremas E-commerce
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF

# Create service-specific environment files if they don't exist
echo -e "${BLUE}🔧 Creating service environment files...${NC}"

# Auth service
cat > services/auth-service/.env << 'EOF'
DATABASE_URL=postgresql://postgres:Conejo1246!!@ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com:5432/ferremas
JWT_SECRET=ewansk-staging-jwt-secret-key-2024-super-secure-v1
JWT_REFRESH_SECRET=ewansk-staging-refresh-secret-key-2024-ultra-secure-v1
NODE_ENV=staging
PORT=3001
EOF

# Product service
cat > services/product-service/.env << 'EOF'
DATABASE_URL=postgresql://postgres:Conejo1246!!@ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com:5432/ferremas
NODE_ENV=staging
PORT=3002
EOF

# Manager service
cat > services/manager-service/.env << 'EOF'
DATABASE_URL=postgresql://postgres:Conejo1246!!@ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com:5432/ferremas
JWT_SECRET=ewansk-staging-jwt-secret-key-2024-super-secure-v1
NODE_ENV=staging
PORT=3003
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF

# Admin service
cat > services/admin-service/.env << 'EOF'
DATABASE_URL=postgresql://postgres:Conejo1246!!@ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com:5432/ferremas
JWT_SECRET=ewansk-staging-jwt-secret-key-2024-super-secure-v1
NODE_ENV=staging
PORT=3004
ADMIN_EMAIL=ewanskurt@gmail.com
EOF

# API Gateway
cat > services/api-gateway/.env << 'EOF'
NODE_ENV=staging
PORT=3000
AUTH_SERVICE_URL=http://auth-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
MANAGER_SERVICE_URL=http://manager-service:3003
ADMIN_SERVICE_URL=http://admin-service:3004
CORS_ORIGIN=http://54.211.97.52:3001
EOF

echo -e "${GREEN}✅ Environment files created successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Configuration Summary:${NC}"
echo "  • Environment: staging"
echo "  • EC2 IP: 54.211.97.52"
echo "  • RDS Endpoint: ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com"
echo "  • Admin Email: ewanskurt@gmail.com"
echo "  • Frontend URL: http://54.211.97.52:3001"
echo "  • API URL: http://54.211.97.52:3000"
echo ""
echo -e "${BLUE}🗄️ Next step: Initialize the database${NC}"
echo "Run: ./init-database.sh"