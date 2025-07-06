#!/bin/bash

# Start all services in production mode
echo "🚀 Starting Ferremas in production mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one from .env.example"
    exit 1
fi

# Start services in production mode
docker-compose up -d

echo ""
echo "✅ Services starting in production mode..."
echo ""
echo "📋 Service URLs:"
echo "   🌐 Frontend:      http://localhost:3001"
echo "   🚪 API Gateway:   http://localhost:3000"
echo "   🗄️  PostgreSQL:    localhost:5432"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f [service-name]"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"