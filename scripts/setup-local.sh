#!/bin/bash

echo "🚀 Setting up Ferremas for local development..."

# Create environment file from template
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update database connection settings."
else
    echo "✅ .env file already exists."
fi

# Install dependencies for all services
echo "📦 Installing dependencies for all services..."

services=("auth-service" "product-service" "manager-service" "admin-service" "api-gateway")

for service in "${services[@]}"; do
    echo "Installing dependencies for $service..."
    cd "services/$service"
    if [ -f "package.json" ]; then
        npm install
    else
        echo "⚠️  No package.json found in services/$service"
    fi
    cd "../.."
done

# Install frontend dependencies
echo "Installing dependencies for frontend..."
cd frontend
if [ -f "package.json" ]; then
    npm install
else
    echo "⚠️  No package.json found in frontend"
fi
cd ..

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/products

echo ""
echo "✅ Local setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your database settings"
echo "2. Make sure PostgreSQL is running (check DATABASE_SETUP.md)"
echo "3. Run database setup if needed"
echo "4. Start services with: ./scripts/start-local.sh"
echo ""
echo "🔧 Database setup commands:"
echo "   node setup-database.js        # Create tables"
echo "   node test-db-connection.js    # Test connection"