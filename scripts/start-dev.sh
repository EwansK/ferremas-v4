#!/bin/bash

# Start all services in development mode
echo "🚀 Starting Ferremas in development mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env file with your configuration"
fi

# Start services with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo ""
echo "✅ Services starting..."
echo ""
echo "📋 Service URLs:"
echo "   🌐 Frontend:      http://localhost:3001"
echo "   🚪 API Gateway:   http://localhost:3000"
echo "   🔐 Auth Service:  http://localhost:3001"
echo "   📦 Product API:   http://localhost:3002"
echo "   👔 Manager API:   http://localhost:3003"
echo "   👨‍💼 Admin API:     http://localhost:3004"
echo "   🗄️  PostgreSQL:    localhost:5432"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f [service-name]"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"