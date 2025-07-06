#!/bin/bash

# AWS EC2 Deployment Script for Ferremas E-commerce
# Run this script on your EC2 instance

echo "🚀 Starting Ferremas deployment on AWS EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📚 Installing Git..."
sudo apt install git -y

# Install Node.js (for development)
echo "⚡ Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
echo "🗄️ Installing PostgreSQL client..."
sudo apt install postgresql-client -y

echo "✅ Dependencies installed successfully!"
echo "⚠️  Please logout and login again to apply Docker group permissions"
echo "💡 Then run: 'docker --version' to verify Docker installation"