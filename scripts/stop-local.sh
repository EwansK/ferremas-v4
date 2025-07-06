#!/bin/bash

echo "🛑 Stopping Ferremas services..."

# Stop services using PID files
services=("auth-service" "product-service" "manager-service" "admin-service" "api-gateway")

for service in "${services[@]}"; do
    if [ -f "logs/${service}.pid" ]; then
        pid=$(cat "logs/${service}.pid")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $service (PID: $pid)..."
            kill $pid
            rm "logs/${service}.pid"
        else
            echo "$service was not running"
            rm -f "logs/${service}.pid"
        fi
    else
        echo "No PID file found for $service"
    fi
done

# Also kill any remaining Node processes on our ports
echo "🧹 Cleaning up any remaining processes..."
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "node.*3002" 2>/dev/null || true
pkill -f "node.*3003" 2>/dev/null || true
pkill -f "node.*3004" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true

echo ""
echo "✅ All services stopped!"
echo ""
echo "📝 Logs are preserved in logs/ directory"
echo "🧹 To clean logs: rm logs/*.log"