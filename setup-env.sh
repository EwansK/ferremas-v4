#!/bin/bash

# Environment Setup Script for AWS Deployment
echo "🔧 Setting up environment variables for AWS deployment..."

# Create main environment file
cat > .env << EOF
# Database Configuration (replace with your RDS details)
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/ferremas
DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=5432
DB_NAME=ferremas
DB_USER=postgres
DB_PASSWORD=YOUR_RDS_PASSWORD

# JWT Configuration (generate strong secrets for production)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
MANAGER_SERVICE_PORT=3003
ADMIN_SERVICE_PORT=3004

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration (replace with your domain or EC2 IP)
CORS_ORIGIN=http://YOUR_DOMAIN_OR_IP:3001

# Environment
NODE_ENV=production
EOF

# Create frontend environment file
cat > frontend/.env.local << EOF
# Frontend Configuration (replace with your domain or EC2 IP)
NEXT_PUBLIC_API_URL=http://YOUR_DOMAIN_OR_IP:3000
EOF

echo "✅ Environment files created!"
echo "🔴 IMPORTANT: You need to edit these files with your actual values:"
echo "   1. Edit .env with your RDS database details"
echo "   2. Edit frontend/.env.local with your domain/IP"
echo ""
echo "Commands to edit:"
echo "   nano .env"
echo "   nano frontend/.env.local"