# Ferremas E-commerce Setup Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (or use Docker)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ferremas-v4
```

### 2. Environment Configuration
```bash
# Copy environment example files
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# Edit .env files with your actual values
nano .env
nano frontend/.env.local
```

### 3. Start with Docker
```bash
# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 4. Initialize Database (First Time Only)
```bash
# Apply database schema
psql -h localhost -U postgres -d ferremas -f database-schema.sql

# Load sample data
psql -h localhost -U postgres -d ferremas -f sample-data.sql
```

### 5. Access the Application
- **Frontend**: http://localhost:3001
- **API Gateway**: http://localhost:3000
- **Admin Panel**: http://localhost:3001/admin

## 🔑 Default Credentials
- **Admin**: admin@ferremas.cl / password123
- **Manager**: manager@ferremas.cl / password123
- **Customer**: cliente1@gmail.com / password123

## 📁 Project Structure
```
ferremas-v4/
├── frontend/                 # Next.js frontend
├── services/
│   ├── api-gateway/         # API Gateway service
│   ├── auth-service/        # Authentication service
│   ├── product-service/     # Product management
│   ├── manager-service/     # Manager operations
│   └── admin-service/       # Admin operations
├── database-schema.sql      # Database schema
├── sample-data.sql          # Sample data
└── docker-compose.yml       # Docker configuration
```

## 🔧 Development

### Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Services (if running locally)
cd services/auth-service && npm install
cd services/product-service && npm install
# ... repeat for all services
```

### Environment Variables Required

#### Root .env
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: JWT refresh token secret

#### Frontend .env.local  
- `NEXT_PUBLIC_API_URL`: API Gateway URL

## 🐳 Docker Services
- **postgres**: PostgreSQL database
- **api-gateway**: Main API gateway (port 3000)
- **auth-service**: Authentication (port 3001)
- **product-service**: Product management (port 3002)
- **manager-service**: Manager operations (port 3003)
- **admin-service**: Admin operations (port 3004)
- **frontend**: Next.js frontend (port 3001)

## ⚠️ Security Notes
- Change default JWT secrets in production
- Use strong database passwords
- Never commit `.env` files to version control
- Ensure proper firewall configuration for production

## 🛠️ Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>
```

### Database connection issues
- Verify DATABASE_URL in .env
- Ensure PostgreSQL is running
- Check network connectivity between containers

### Port conflicts
- Modify ports in docker-compose.yml if needed
- Update NEXT_PUBLIC_API_URL accordingly