#!/bin/bash

# Start all Ferremas services locally
echo "🚀 Starting Ferremas services locally..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Kill any existing Node processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "node.*3002" 2>/dev/null || true  
pkill -f "node.*3003" 2>/dev/null || true
pkill -f "node.*3004" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo "Starting $service_name on port $port..."
    cd "$service_path"
    
    # Start the service in background
    npm start > "../../logs/${service_name}.log" 2>&1 &
    local pid=$!
    echo "$pid" > "../../logs/${service_name}.pid"
    
    cd - > /dev/null
    echo "✅ $service_name started (PID: $pid)"
}

# Create logs directory
mkdir -p logs

# Start services in order
echo ""
echo "🔧 Starting backend services..."

# Start Auth Service (3001)
start_service "auth-service" "services/auth-service" "3001"
sleep 3

# Start Product Service (3002)  
start_service "product-service" "services/product-service" "3002"
sleep 2

# Start Manager Service (3003)
start_service "manager-service" "services/manager-service" "3003"
sleep 2

# Start Admin Service (3004)
start_service "admin-service" "services/admin-service" "3004"
sleep 2

# Start API Gateway (3000)
start_service "api-gateway" "services/api-gateway" "3000"
sleep 3

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
echo "📊 Check service status:"
echo "   ./scripts/status-local.sh"
echo ""
echo "📝 View logs:"
echo "   tail -f logs/[service-name].log"
echo ""
echo "🛑 Stop all services:"
echo "   ./scripts/stop-local.sh"

# Test if services are responding
echo ""
echo "🔍 Testing service health..."
sleep 5

services=("3000:API-Gateway" "3001:Auth-Service" "3002:Product-Service" "3003:Manager-Service" "3004:Admin-Service")

for service in "${services[@]}"; do
    port="${service%%:*}"
    name="${service##*:}"
    
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
done