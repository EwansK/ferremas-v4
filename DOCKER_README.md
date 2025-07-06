# 🐳 Ferremas Docker Setup

This document explains how to run the Ferremas e-commerce application using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Desktop (with WSL2 integration enabled)
- Docker Compose v2.0 or higher
- At least 4GB of available RAM
- Ports 3000-3004 and 5432 available on your system

## 🏗️ Architecture

The application consists of 6 containerized services:

```
┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │   API Gateway   │
│   (Next.js)     │────│   (Port 3000)   │
│   Port 3001     │    │                 │
└─────────────────┘    └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Auth Service   │  │ Product Service │  │ Manager Service │
│   Port 3001     │  │   Port 3002     │  │   Port 3003     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────────────┐
                    │  Admin Service  │
                    │   Port 3004     │
                    └─────────────────┘
                              │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Port 5432     │
                    └─────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 2. Development Mode (Recommended)

```bash
# Start all services with hot reload
./scripts/start-dev.sh

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 3. Production Mode

```bash
# Build and start all services
./scripts/start-prod.sh

# Or manually:
docker-compose up -d
```

## 📊 Service URLs

Once started, access the services at:

- **Frontend**: http://localhost:3001
- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001 (internal)
- **Product Service**: http://localhost:3002 (internal)
- **Manager Service**: http://localhost:3003 (internal)
- **Admin Service**: http://localhost:3004 (internal)
- **PostgreSQL**: localhost:5432

## 🛠️ Management Commands

### Building Services

```bash
# Build all service images
./scripts/build-services.sh

# Build individual service
docker build -t ferremas-auth-service ./services/auth-service
```

### Starting Services

```bash
# Development mode (with hot reload)
./scripts/start-dev.sh

# Production mode
./scripts/start-prod.sh
```

### Stopping Services

```bash
# Stop all services
./scripts/stop-services.sh

# Stop and remove volumes (⚠️ DATABASE WILL BE LOST)
docker-compose down -v
```

### Viewing Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f auth-service
docker-compose logs -f api-gateway
docker-compose logs -f postgres
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Test API Gateway
curl http://localhost:3000/health

# Test individual services
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Product
curl http://localhost:3003/health  # Manager
curl http://localhost:3004/health  # Admin
```

## 🔧 Development Features

### Hot Reload

In development mode, the following directories are mounted for hot reload:

- `./services/auth-service` → `/app` (auth-service container)
- `./services/product-service` → `/app` (product-service container)
- `./services/manager-service` → `/app` (manager-service container)
- `./services/admin-service` → `/app` (admin-service container)
- `./services/api-gateway` → `/app` (api-gateway container)
- `./frontend` → `/app` (frontend container)

### File Uploads

File uploads are handled through shared volumes:

- Manager service uploads: `uploads_data` volume
- API Gateway static serving: Same `uploads_data` volume

### Database Persistence

PostgreSQL data is persisted using the `postgres_data` volume. The database is automatically initialized with:

- Schema from `database-schema.sql`
- Sample data from `sample-data.sql`

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3000-3004
   lsof -i :5432
   
   # Stop conflicting services
   sudo systemctl stop postgresql  # If local PostgreSQL is running
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL health
   docker-compose logs postgres
   
   # Recreate database
   docker-compose down -v
   docker-compose up -d postgres
   ```

3. **Service Won't Start**
   ```bash
   # Check service logs
   docker-compose logs [service-name]
   
   # Rebuild service
   docker-compose build [service-name]
   docker-compose up -d [service-name]
   ```

4. **File Upload Issues**
   ```bash
   # Check volume permissions
   docker-compose exec manager-service ls -la /app/uploads
   
   # Recreate upload volume
   docker-compose down
   docker volume rm ferremas-v4_uploads_data
   docker-compose up -d
   ```

### Debugging Commands

```bash
# Enter service container
docker-compose exec auth-service sh
docker-compose exec postgres psql -U postgres -d ferremas

# View container resource usage
docker stats

# Clean up everything
docker-compose down -v
docker system prune -f
```

## 🔒 Security Notes

### Development vs Production

**Development Mode:**
- Uses hardcoded secrets (change for production!)
- Enables hot reload with volume mounts
- Exposes individual service ports
- Detailed logging enabled

**Production Mode:**
- Requires proper environment configuration
- No source code mounting
- Only API Gateway and Frontend exposed
- Optimized for performance

### Environment Variables

Critical variables to change for production:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
DB_PASSWORD=your-secure-database-password
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## 🆘 Getting Help

If you encounter issues:

1. Check the service logs: `docker-compose logs -f [service-name]`
2. Verify environment configuration: `cat .env`
3. Test individual services: `curl http://localhost:PORT/health`
4. Rebuild if needed: `docker-compose build [service-name]`

For more detailed information, refer to the main project README or contact the development team.