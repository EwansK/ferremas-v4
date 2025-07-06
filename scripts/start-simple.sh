#!/bin/bash

echo "🚀 Starting Ferremas services one by one..."

# Function to start a service and wait
start_and_test() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo ""
    echo "Starting $service_name..."
    cd "$service_path"
    
    # Start the service in background
    npm start &
    local pid=$!
    
    # Wait for service to start
    sleep 5
    
    # Test if it's responding
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $service_name is healthy on port $port"
    else
        echo "⚠️  $service_name started but health check failed"
    fi
    
    cd - > /dev/null
}

# Kill existing processes
echo "🧹 Stopping any existing services..."
pkill -f "node.*src/index.js" 2>/dev/null || true
sleep 2

# Start services
start_and_test "auth-service" "services/auth-service" "3001"
start_and_test "product-service" "services/product-service" "3002"  
start_and_test "manager-service" "services/manager-service" "3003"
start_and_test "admin-service" "services/admin-service" "3004"
start_and_test "api-gateway" "services/api-gateway" "3000"

echo ""
echo "✅ All services started!"
echo ""
echo "📋 Service URLs:"
echo "   🚪 API Gateway:   http://localhost:3000"
echo "   🔐 Auth Service:  http://localhost:3001"
echo "   📦 Product API:   http://localhost:3002"
echo "   👔 Manager API:   http://localhost:3003"
echo "   👨‍💼 Admin API:     http://localhost:3004"
echo ""
echo "🔍 Test all services:"
echo "   curl http://localhost:3000/health"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3002/health"
echo "   curl http://localhost:3003/health"
echo "   curl http://localhost:3004/health"