#!/bin/bash

# 🗄️ Database Initialization Script for EWansK's Ferremas
# Connects to RDS and sets up the database schema and sample data

echo "🗄️ Initializing database for EWansK's Ferremas..."
echo "RDS Endpoint: ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Database connection details
DB_HOST="ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com"
DB_USER="postgres"
DB_NAME="ferremas"
DB_PASSWORD="Conejo1246!!"

echo -e "${BLUE}🔍 Testing database connection...${NC}"

# Test connection
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
else
    echo -e "${RED}❌ Database connection failed!${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo "  • RDS instance is running"
    echo "  • Security groups allow connections from EC2"
    echo "  • Password is correct: Conejo1246!!"
    exit 1
fi

echo -e "${BLUE}📋 Creating database schema...${NC}"

# Create schema
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database-schema.sql; then
    echo -e "${GREEN}✅ Database schema created successfully!${NC}"
else
    echo -e "${RED}❌ Failed to create database schema${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Loading sample data...${NC}"

# Load sample data
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f sample-data.sql; then
    echo -e "${GREEN}✅ Sample data loaded successfully!${NC}"
else
    echo -e "${RED}❌ Failed to load sample data${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verifying data was loaded...${NC}"

# Verify data
echo "Checking tables and data:"

# Count users
USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;")
echo "  • Users: $USER_COUNT"

# Count products
PRODUCT_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM products;")
echo "  • Products: $PRODUCT_COUNT"

# Count categories
CATEGORY_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM categories;")
echo "  • Categories: $CATEGORY_COUNT"

# Count roles
ROLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM roles;")
echo "  • Roles: $ROLE_COUNT"

echo ""
echo -e "${GREEN}🎉 Database initialization completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Test Accounts Created:${NC}"
echo "  • Admin: admin@ferremas.cl / password123"
echo "  • Manager: manager@ferremas.cl / password123"
echo "  • Customer: cliente1@gmail.com / password123"
echo "  • Customer: cliente2@gmail.com / password123"
echo ""
echo -e "${BLUE}🚀 Next step: Start the application services${NC}"
echo "Run: docker-compose up -d"