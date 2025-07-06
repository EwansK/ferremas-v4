#!/bin/bash

# Build all microservices Docker images
echo "🏗️  Building Ferremas microservices..."

# Build auth-service
echo "Building auth-service..."
docker build -t ferremas-auth-service ./services/auth-service

# Build product-service
echo "Building product-service..."
docker build -t ferremas-product-service ./services/product-service

# Build manager-service
echo "Building manager-service..."
docker build -t ferremas-manager-service ./services/manager-service

# Build admin-service
echo "Building admin-service..."
docker build -t ferremas-admin-service ./services/admin-service

# Build api-gateway
echo "Building api-gateway..."
docker build -t ferremas-api-gateway ./services/api-gateway

# Build frontend
echo "Building frontend..."
docker build -t ferremas-frontend ./frontend

echo "✅ All services built successfully!"
echo ""
echo "🚀 To start all services, run:"
echo "   docker-compose up -d"
echo ""
echo "📊 To start with development mode (hot reload):"
echo "   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d"