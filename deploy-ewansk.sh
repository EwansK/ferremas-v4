#!/bin/bash

# 🚀 EWansK's Ferremas Deployment Script for AWS EC2
# Personalized deployment script with real values

echo "🚀 Starting EWansK's Ferremas deployment on AWS EC2..."
echo "Target: 54.211.97.52 (us-east-1)"
echo "Environment: staging"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
echo -e "${BLUE}🔧 Installing Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo -e "${BLUE}📚 Installing Git...${NC}"
sudo apt install git -y

# Install Node.js
echo -e "${BLUE}⚡ Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
echo -e "${BLUE}🗄️ Installing PostgreSQL client...${NC}"
sudo apt install postgresql-client -y

# Install useful tools
echo -e "${BLUE}🛠️ Installing additional tools...${NC}"
sudo apt install htop curl wget nano -y

echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Please logout and login again to apply Docker group permissions${NC}"
echo -e "${YELLOW}💡 After reconnecting, run the following commands:${NC}"
echo ""
echo -e "${BLUE}# Verify installations:${NC}"
echo "docker --version"
echo "docker-compose --version"
echo "node --version"
echo "git --version"
echo ""
echo -e "${BLUE}# Clone repository:${NC}"
echo "git clone https://github.com/EWansK/ferremas-v4.git"
echo "cd ferremas-v4"
echo ""
echo -e "${BLUE}# Run setup script:${NC}"
echo "./setup-ewansk-env.sh"
echo ""
echo -e "${GREEN}🎯 Next step: Logout and reconnect to EC2, then clone the repository!${NC}"