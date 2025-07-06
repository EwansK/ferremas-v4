#!/bin/bash

# Stop all Ferremas services
echo "🛑 Stopping Ferremas services..."

docker-compose down

echo ""
echo "✅ All services stopped!"
echo ""
echo "🗄️  To also remove volumes (DATABASE WILL BE LOST):"
echo "   docker-compose down -v"
echo ""
echo "🧹 To clean up images:"
echo "   docker rmi ferremas-auth-service ferremas-product-service ferremas-manager-service ferremas-admin-service ferremas-api-gateway ferremas-frontend"