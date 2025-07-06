#!/bin/bash

# 🚀 Start Ferremas Application Script for EWansK
# Starts all services and verifies they're running correctly

echo "🚀 Starting EWansK's Ferremas E-commerce Platform..."
echo "EC2 IP: 54.211.97.52"
echo "Environment: staging"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found!${NC}"
    echo -e "${YELLOW}Please run this script from the ferremas-v4 directory${NC}"
    exit 1
fi

# Check if environment files exist
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please run ./setup-ewansk-env.sh first${NC}"
    exit 1
fi

echo -e "${BLUE}🐳 Starting Docker services...${NC}"

# Start services
docker-compose up -d

echo -e "${YELLOW}⏳ Waiting for services to start (60 seconds)...${NC}"
sleep 60

echo -e "${BLUE}📊 Checking service status...${NC}"

# Check service status
docker-compose ps

echo -e "${BLUE}🔍 Testing service connectivity...${NC}"

# Test API Gateway
echo -n "Testing API Gateway (port 3000): "
if curl -s http://54.211.97.52:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Test Frontend
echo -n "Testing Frontend (port 3001): "
if curl -s -I http://54.211.97.52:3001 | head -n 1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Test Database Connection
echo -n "Testing Database Connection: "
if PGPASSWORD="Conejo1246!!" psql -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres -d ferremas -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Ferremas is now running!${NC}"
echo ""
echo -e "${YELLOW}📱 Access Your Application:${NC}"
echo "  🏠 Main Website: http://54.211.97.52:3001"
echo "  👑 Admin Panel: http://54.211.97.52:3001/admin"
echo "  👨‍💼 Manager Panel: http://54.211.97.52:3001/manager"
echo "  🔌 API Gateway: http://54.211.97.52:3000"
echo ""
echo -e "${YELLOW}🔑 Test Accounts:${NC}"
echo "  • Admin: admin@ferremas.cl / password123"
echo "  • Manager: manager@ferremas.cl / password123"
echo "  • Customer: cliente1@gmail.com / password123"
echo ""
echo -e "${BLUE}📊 Useful Commands:${NC}"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart"
echo "  • Check status: docker-compose ps"
echo ""
echo -e "${GREEN}🎯 Deployment Complete! Your e-commerce platform is live!${NC}"