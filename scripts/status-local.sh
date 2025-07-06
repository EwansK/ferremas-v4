#!/bin/bash

echo "📊 Ferremas Services Status"
echo "=========================="

# Check if services are running
services=("auth-service:3001" "product-service:3002" "manager-service:3003" "admin-service:3004" "api-gateway:3000")

for service in "${services[@]}"; do
    service_name="${service%%:*}"
    port="${service##*:}"
    
    # Check if PID file exists and process is running
    if [ -f "logs/${service_name}.pid" ]; then
        pid=$(cat "logs/${service_name}.pid")
        if ps -p $pid > /dev/null 2>&1; then
            # Test if service responds to health check
            if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
                echo "✅ $service_name (PID: $pid) - Port $port - HEALTHY"
            else
                echo "⚠️  $service_name (PID: $pid) - Port $port - RUNNING (no health check)"
            fi
        else
            echo "❌ $service_name - STOPPED (stale PID file)"
            rm -f "logs/${service_name}.pid"
        fi
    else
        echo "❌ $service_name - STOPPED"
    fi
done

echo ""
echo "🔍 Port Usage:"
netstat -tlnp 2>/dev/null | grep ":300[0-4]" | while read line; do
    port=$(echo $line | awk '{print $4}' | cut -d: -f2)
    echo "   Port $port: USED"
done

echo ""
echo "📝 Recent Log Entries:"
echo "====================="
for service in "${services[@]}"; do
    service_name="${service%%:*}"
    if [ -f "logs/${service_name}.log" ]; then
        echo ""
        echo "--- $service_name (last 3 lines) ---"
        tail -n 3 "logs/${service_name}.log" 2>/dev/null || echo "No logs available"
    fi
done

echo ""
echo "🔧 Management Commands:"
echo "   ./scripts/start-local.sh  - Start all services"
echo "   ./scripts/stop-local.sh   - Stop all services"  
echo "   tail -f logs/[service].log - View real-time logs"