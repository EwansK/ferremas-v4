# Ferremas V4 - GitHub Versioning Strategy & Implementation Guide

## Overview

This document provides step-by-step instructions for implementing a GitHub versioning strategy for the Ferremas V4 microservices e-commerce application.

## Table of Contents

1. [Repository Setup](#repository-setup)
2. [Branching Strategy](#branching-strategy)
3. [Versioning Scheme](#versioning-scheme)
4. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
5. [Development Workflow](#development-workflow)
6. [Release Process](#release-process)
7. [Migration Steps](#migration-steps)

---

## Repository Setup

### Step 1: Create GitHub Repository

1. **Create new repository on GitHub:**
   ```bash
   # Repository name: ferremas-v4
   # Description: E-commerce microservices application with Next.js frontend
   # Visibility: Private (recommended for commercial project)
   # Initialize with README: No (we'll push existing code)
   ```

2. **Configure repository settings:**
   - Go to Settings → General
   - Enable "Automatically delete head branches"
   - Set default branch to `main`

### Step 2: Initialize Local Repository

```bash
# Navigate to project directory
cd /path/to/ferremas-v4

# Initialize git repository
git init

# Add remote origin
git remote add origin https://github.com/yourusername/ferremas-v4.git

# Create initial commit
git add .
git commit -m "feat: initial commit - ferremas v4 microservices architecture

- Add auth, product, manager, admin services
- Add Next.js frontend with admin dashboard
- Add Docker Compose orchestration
- Add PostgreSQL database schema
- Add API Gateway with service routing"

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Create Repository Structure

```bash
# Create documentation directory
mkdir -p docs/{api,deployment,architecture}

# Create scripts directory for automation
mkdir -p scripts/{ci,deployment,development}

# Move existing scripts
mv scripts/*.sh scripts/development/

# Create version tracking file
touch VERSION.md
```

---

## Branching Strategy

### Branch Structure

```
main (production-ready code)
├── develop (integration branch)
├── feature/service-name/feature-description
├── release/v2.1.0
├── hotfix/service-name/critical-fix
└── docs/documentation-updates
```

### Step 4: Set Up Core Branches

```bash
# Create and push develop branch
git checkout -b develop
git push -u origin develop

# Return to main
git checkout main
```

### Step 5: Configure Branch Protection Rules

**In GitHub repository settings:**

1. **Go to Settings → Branches**
2. **Add rule for `main` branch:**
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Restrict pushes that create new files
   - Require conversation resolution before merging

3. **Add rule for `develop` branch:**
   - Require pull request reviews before merging
   - Require status checks to pass before merging

---

## Versioning Scheme

### Hybrid Versioning Strategy

**System-Level Version:** `v2.1.0`
- Tracks overall application releases
- Used for deployments and changelogs

**Service-Level Versions:** Each service maintains its own version
```
auth-service: v1.3.2
product-service: v1.5.1
manager-service: v1.2.4
admin-service: v1.1.0
api-gateway: v1.4.3
frontend: v2.0.1
```

### Step 6: Create VERSION.md File

```bash
cat > VERSION.md << 'EOF'
# Ferremas V4 Version Information

## Current System Version: v1.0.0

### Service Versions
- **auth-service**: v1.0.0
- **product-service**: v1.0.0  
- **manager-service**: v1.0.0
- **admin-service**: v1.0.0
- **api-gateway**: v1.0.0
- **frontend**: v1.0.0

### Version History
| System Version | Release Date | Description |
|----------------|--------------|-------------|
| v1.0.0         | 2025-06-24   | Initial release with core functionality |

### Service Change Log
#### auth-service
- v1.0.0 (2025-06-24): JWT authentication, user management

#### product-service  
- v1.0.0 (2025-06-24): Product catalog, categories, search

#### manager-service
- v1.0.0 (2025-06-24): Inventory management, product CRUD

#### admin-service
- v1.0.0 (2025-06-24): User administration, analytics

#### api-gateway
- v1.0.0 (2025-06-24): Service routing, authentication middleware

#### frontend
- v1.0.0 (2025-06-24): Next.js app with admin dashboard
EOF
```

### Step 7: Create Service Package.json Versioning

Update each service's package.json with initial version:

```bash
# Update each service package.json
cd services/auth-service
npm version 1.0.0 --no-git-tag-version

cd ../product-service
npm version 1.0.0 --no-git-tag-version

cd ../manager-service
npm version 1.0.0 --no-git-tag-version

cd ../admin-service
npm version 1.0.0 --no-git-tag-version

cd ../api-gateway
npm version 1.0.0 --no-git-tag-version

cd ../../frontend
npm version 1.0.0 --no-git-tag-version
```

---

## CI/CD Pipeline Setup

### Step 8: Create GitHub Actions Workflow

Create `.github/workflows/ci-cd.yml`:

```bash
mkdir -p .github/workflows

cat > .github/workflows/ci-cd.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      auth-service: ${{ steps.changes.outputs.auth-service }}
      product-service: ${{ steps.changes.outputs.product-service }}
      manager-service: ${{ steps.changes.outputs.manager-service }}
      admin-service: ${{ steps.changes.outputs.admin-service }}
      api-gateway: ${{ steps.changes.outputs.api-gateway }}
      frontend: ${{ steps.changes.outputs.frontend }}
      shared: ${{ steps.changes.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            auth-service:
              - 'services/auth-service/**'
              - 'shared/**'
            product-service:
              - 'services/product-service/**'
              - 'shared/**'
            manager-service:
              - 'services/manager-service/**'
              - 'shared/**'
            admin-service:
              - 'services/admin-service/**'
              - 'shared/**'
            api-gateway:
              - 'services/api-gateway/**'
              - 'shared/**'
            frontend:
              - 'frontend/**'
            shared:
              - 'shared/**'
              - 'database-schema.sql'
              - 'docker-compose.yml'

  test-services:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth-service, product-service, manager-service, admin-service, api-gateway]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        if: needs.detect-changes.outputs[matrix.service] == 'true'
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: services/${{ matrix.service }}/package-lock.json
      
      - name: Install dependencies
        if: needs.detect-changes.outputs[matrix.service] == 'true'
        run: |
          cd services/${{ matrix.service }}
          npm ci
      
      - name: Run tests
        if: needs.detect-changes.outputs[matrix.service] == 'true'
        run: |
          cd services/${{ matrix.service }}
          npm test || echo "No tests defined for ${{ matrix.service }}"

  test-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run linting
        run: |
          cd frontend
          npm run lint
      
      - name: Build application
        run: |
          cd frontend
          npm run build

  integration-test:
    needs: [detect-changes, test-services, test-frontend]
    if: always() && (needs.test-services.result == 'success' || needs.test-services.result == 'skipped') && (needs.test-frontend.result == 'success' || needs.test-frontend.result == 'skipped')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start services
        run: |
          docker-compose up -d
          sleep 30
      
      - name: Run integration tests
        run: |
          # Add integration test commands here
          docker-compose exec -T api-gateway curl -f http://localhost:3000/health || exit 1
      
      - name: Stop services
        if: always()
        run: docker-compose down

  build-and-push:
    needs: [detect-changes, integration-test]
    if: github.ref == 'refs/heads/main' && (github.event_name == 'push')
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth-service, product-service, manager-service, admin-service, api-gateway, frontend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        if: needs.detect-changes.outputs[matrix.service] == 'true'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        if: needs.detect-changes.outputs[matrix.service] == 'true'
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
      
      - name: Build and push Docker image
        if: needs.detect-changes.outputs[matrix.service] == 'true'
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.service == 'frontend' && './frontend' || format('./services/{0}', matrix.service) }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
EOF
```

### Step 9: Create Deployment Workflow

Create `.github/workflows/deploy.yml`:

```bash
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Environment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production
      version:
        description: 'Version tag to deploy'
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}
      
      - name: Deploy to ${{ inputs.environment }}
        run: |
          echo "Deploying version ${{ inputs.version }} to ${{ inputs.environment }}"
          # Add deployment commands here
          # docker-compose -f docker-compose.${{ inputs.environment }}.yml up -d
      
      - name: Health check
        run: |
          sleep 30
          # Add health check commands
          echo "Health check passed"
      
      - name: Notify deployment
        if: always()
        run: |
          echo "Deployment ${{ job.status }} for version ${{ inputs.version }} to ${{ inputs.environment }}"
EOF
```

---

## Development Workflow

### Step 10: Create Development Guidelines

Create `CONTRIBUTING.md`:

```bash
cat > CONTRIBUTING.md << 'EOF'
# Contributing to Ferremas V4

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/service-name/feature-description

# Make changes and commit
git add .
git commit -m "feat(service-name): add new feature

- Detailed description of changes
- Any breaking changes
- References to issues"

# Push and create PR
git push origin feature/service-name/feature-description
```

### 2. Commit Message Convention

Use Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Scopes:**
- `auth`: auth-service changes
- `product`: product-service changes
- `manager`: manager-service changes
- `admin`: admin-service changes
- `gateway`: api-gateway changes
- `frontend`: frontend changes
- `shared`: shared utilities changes
- `infra`: infrastructure changes

### 3. Pull Request Process

1. Create PR from feature branch to `develop`
2. Ensure all CI checks pass
3. Request review from team members
4. Address review feedback
5. Merge using "Squash and merge"

### 4. Release Process

See [Release Process](#release-process) section below.

## Code Standards

### Service Development
- Follow existing code structure
- Add comprehensive tests
- Update API documentation
- Ensure Docker builds successfully

### Frontend Development
- Follow Next.js best practices
- Maintain TypeScript types
- Ensure accessibility standards
- Test responsive design

## Testing Requirements

### Unit Tests
- Minimum 80% code coverage
- Test business logic thoroughly
- Mock external dependencies

### Integration Tests
- Test service interactions
- Verify API contracts
- Test database operations

### End-to-End Tests
- Test critical user journeys
- Verify full system functionality
- Test across different browsers
EOF
```

---

## Release Process

### Step 11: Create Release Automation Scripts

Create `scripts/ci/create-release.sh`:

```bash
mkdir -p scripts/ci

cat > scripts/ci/create-release.sh << 'EOF'
#!/bin/bash

# Ferremas V4 Release Creation Script

set -e

# Configuration
CURRENT_VERSION=$(grep "Current System Version:" VERSION.md | cut -d' ' -f5)
echo "Current version: $CURRENT_VERSION"

# Get new version from user
echo "Enter new version (e.g., 2.1.0):"
read NEW_VERSION

if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Invalid version format. Use semantic versioning (x.y.z)"
    exit 1
fi

echo "Creating release v$NEW_VERSION..."

# Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v$NEW_VERSION

# Update VERSION.md
sed -i "s/Current System Version: v$CURRENT_VERSION/Current System Version: v$NEW_VERSION/" VERSION.md

# Update version history in VERSION.md
RELEASE_DATE=$(date +%Y-%m-%d)
sed -i "/| v$CURRENT_VERSION/a | v$NEW_VERSION         | $RELEASE_DATE   | Release v$NEW_VERSION |" VERSION.md

# Update service versions (example for when services change)
echo "Which services have changes? (comma-separated, e.g., auth-service,frontend):"
read CHANGED_SERVICES

IFS=',' read -ra SERVICES <<< "$CHANGED_SERVICES"
for service in "${SERVICES[@]}"; do
    service=$(echo $service | xargs) # trim whitespace
    echo "Enter new version for $service:"
    read SERVICE_VERSION
    
    # Update service package.json
    if [ "$service" = "frontend" ]; then
        cd frontend
        npm version $SERVICE_VERSION --no-git-tag-version
        cd ..
    else
        cd services/$service
        npm version $SERVICE_VERSION --no-git-tag-version
        cd ../..
    fi
    
    # Update VERSION.md service section
    sed -i "s/\*\*$service\*\*: v[0-9]*\.[0-9]*\.[0-9]*/\*\*$service\*\*: v$SERVICE_VERSION/" VERSION.md
done

# Commit changes
git add .
git commit -m "chore: bump version to v$NEW_VERSION

- Update system version to v$NEW_VERSION
- Update changed service versions
- Prepare for release"

# Push release branch
git push origin release/v$NEW_VERSION

echo "Release branch created: release/v$NEW_VERSION"
echo "Next steps:"
echo "1. Create PR from release/v$NEW_VERSION to main"
echo "2. After PR approval and merge, create GitHub release"
echo "3. Deploy to production"
EOF

chmod +x scripts/ci/create-release.sh
```

### Step 12: Create GitHub Release Template

Create `.github/RELEASE_TEMPLATE.md`:

```bash
mkdir -p .github

cat > .github/RELEASE_TEMPLATE.md << 'EOF'
# Release v{VERSION}

## 📋 What's New

### ✨ Features
- New feature 1
- New feature 2

### 🐛 Bug Fixes
- Fixed issue 1
- Fixed issue 2

### 🔧 Improvements
- Performance improvement 1
- UI/UX enhancement 1

### 📚 Documentation
- Updated API documentation
- Added deployment guides

## 🚀 Deployment

### Service Versions
- **auth-service**: v{AUTH_VERSION}
- **product-service**: v{PRODUCT_VERSION}
- **manager-service**: v{MANAGER_VERSION}
- **admin-service**: v{ADMIN_VERSION}
- **api-gateway**: v{GATEWAY_VERSION}
- **frontend**: v{FRONTEND_VERSION}

### Migration Steps
1. Backup database
2. Deploy services in order: auth → product → manager → admin → gateway → frontend
3. Run database migrations if any
4. Verify health checks

## 🧪 Testing

### Pre-deployment Checklist
- [ ] All CI tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Database migrations tested
- [ ] Performance testing completed

### Post-deployment Verification
- [ ] Health checks pass
- [ ] Key user journeys working
- [ ] No critical errors in logs
- [ ] Performance metrics normal

## 📊 Metrics

### Performance Impact
- Response time: {RESPONSE_TIME}
- Error rate: {ERROR_RATE}
- Throughput: {THROUGHPUT}

## 🔄 Rollback Plan

If issues are detected:
1. Run rollback script: `./scripts/deployment/rollback.sh v{PREVIOUS_VERSION}`
2. Monitor logs and metrics
3. Communicate with team

## 👥 Contributors

Thanks to all contributors who made this release possible!

---

**Full Changelog**: https://github.com/yourusername/ferremas-v4/compare/v{PREVIOUS_VERSION}...v{VERSION}
EOF
```

---

## Migration Steps

### Step 13: Initial Repository Migration

```bash
# 1. Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/
out/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
*.log

# Database
*.sqlite
*.db

# Uploads
uploads/*
!uploads/.gitkeep
EOF

# 2. Create uploads directory placeholder
mkdir -p uploads
touch uploads/.gitkeep

# 3. Commit all setup files
git add .
git commit -m "chore: setup versioning strategy and CI/CD pipeline

- Add GitHub Actions workflows for CI/CD
- Add branch protection and development guidelines
- Add release automation scripts
- Add version tracking system
- Configure hybrid versioning strategy"

# 4. Push to develop branch
git push origin develop

# 5. Create initial PR to main
echo "Create PR from develop to main with title: 'Initial versioning setup and CI/CD pipeline'"
```

### Step 14: Set Up Development Environment

```bash
# Create development setup script
cat > scripts/development/setup-dev.sh << 'EOF'
#!/bin/bash

echo "Setting up Ferremas V4 development environment..."

# Install dependencies for all services
echo "Installing service dependencies..."
for service in auth-service product-service manager-service admin-service api-gateway; do
    echo "Installing dependencies for $service..."
    cd services/$service
    npm install
    cd ../..
done

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files
echo "Creating environment files..."
cp .env.example .env.local 2>/dev/null || echo "No .env.example found"

# Set up database
echo "Setting up database..."
docker-compose up -d postgres
sleep 10
docker-compose exec postgres psql -U postgres -d ferremas -f /docker-entrypoint-initdb.d/01-schema.sql
docker-compose exec postgres psql -U postgres -d ferremas -f /docker-entrypoint-initdb.d/02-data.sql

echo "Development environment setup complete!"
echo "Run 'npm run dev' to start the development server"
EOF

chmod +x scripts/development/setup-dev.sh
```

### Step 15: Final Validation

```bash
# Test the CI pipeline locally (if using act)
# act -j detect-changes

# Validate Docker builds
docker-compose build

# Test services startup
docker-compose up -d
sleep 30
curl -f http://localhost:3000/health
docker-compose down

echo "✅ Versioning strategy implementation complete!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub and set up branch protection rules"
echo "2. Configure GitHub Actions secrets if needed"
echo "3. Create first release using scripts/ci/create-release.sh"
echo "4. Train team on new development workflow"
```

---

## Summary

This versioning strategy provides:

✅ **Structured Development**: Clear branching and workflow guidelines  
✅ **Automated CI/CD**: Smart service detection and testing  
✅ **Flexible Versioning**: Hybrid system + service level versioning  
✅ **Release Management**: Automated release creation and deployment  
✅ **Team Collaboration**: PR templates and contribution guidelines  
✅ **Quality Assurance**: Automated testing and validation  

The monorepo approach with service-aware CI/CD gives you the benefits of unified development while maintaining the flexibility to evolve toward polyrepo if needed as the team grows.