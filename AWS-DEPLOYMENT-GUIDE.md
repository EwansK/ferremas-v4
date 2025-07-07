# AWS Deployment Guide - Ferremas E-commerce

This guide helps you deploy the Ferremas application to AWS without encountering CORS issues.

## 🚀 Quick Start

### 1. Prepare Environment Variables

Copy the AWS environment template:
```bash
cp .env.aws.example .env.aws
```

Edit `.env.aws` with your actual AWS values:
```bash
# Your actual domains
CORS_ORIGIN=https://your-app.example.com,https://www.your-app.example.com
AWS_FRONTEND_URL=https://your-app.example.com
AWS_API_URL=https://api.your-app.example.com

# Your custom domain
CUSTOM_DOMAIN=your-app.example.com

# Frontend API URL
NEXT_PUBLIC_API_URL=https://api.your-app.example.com

# Database (use AWS RDS)
DATABASE_URL=postgresql://username:password@your-rds.region.rds.amazonaws.com:5432/ferremas
```

### 2. Deploy Using AWS Compose Configuration

```bash
# Load AWS environment
export $(cat .env.aws | xargs)

# Deploy with AWS configuration
docker-compose -f docker-compose.yml -f docker-compose.aws.yml up -d --build
```

## 🔧 AWS Infrastructure Setup

### Required AWS Services

1. **Application Load Balancer (ALB)**
   - Frontend: `your-app.example.com` → Frontend container (port 3001)
   - API: `api.your-app.example.com` → API Gateway container (port 3000)

2. **RDS PostgreSQL Database**
   - Replace the containerized PostgreSQL with AWS RDS
   - Update `DATABASE_URL` in environment variables

3. **ECS or EC2 for containers**
   - Run your Docker containers
   - Use the provided `docker-compose.aws.yml`

4. **Route 53 (optional)**
   - DNS management for custom domains
   - SSL/TLS certificates via ACM

### 🔐 CORS Configuration

The application is now configured to automatically handle CORS for AWS deployment:

#### Environment Variables Used:
- `CORS_ORIGIN`: Main CORS origins (comma-separated)
- `AWS_FRONTEND_URL`: Your CloudFront/ALB frontend URL
- `AWS_API_URL`: Your API Gateway URL  
- `CUSTOM_DOMAIN`: Your custom domain (auto-adds https:// and www.)

#### Example CORS Setup:
```bash
# Single origin
CORS_ORIGIN=https://my-ferremas-app.com

# Multiple origins
CORS_ORIGIN=https://my-app.com,https://www.my-app.com,https://staging.my-app.com

# With custom domain
CUSTOM_DOMAIN=my-app.com
# This automatically allows:
# - https://my-app.com
# - https://www.my-app.com
```

## 🏗️ Deployment Options

### Option 1: ECS with Fargate
```bash
# Build and push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Tag and push each service
docker tag ferremas-v4-auth-service:latest your-account.dkr.ecr.us-east-1.amazonaws.com/ferremas-auth:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/ferremas-auth:latest
```

### Option 2: EC2 with Docker Compose
```bash
# On your EC2 instance
git clone your-repo
cd ferremas-v4

# Copy your AWS environment file
cp .env.aws.example .env.aws
# Edit .env.aws with your values

# Deploy
export $(cat .env.aws | xargs)
docker-compose -f docker-compose.aws.yml up -d
```

### Option 3: AWS App Runner
- Use the provided Dockerfiles
- Configure environment variables in App Runner
- Set up custom domains and SSL

## 🔧 Configuration Details

### Frontend API Configuration

The frontend automatically chooses the right API URL:

**Development:**
- Browser: `http://localhost:3000`
- Server-side: `http://api-gateway:3000`

**Production:**
- Browser: `process.env.NEXT_PUBLIC_API_URL` (your public API URL)
- Server-side: `process.env.AWS_INTERNAL_API_URL` (your internal API URL)

### CORS Middleware Features

✅ **Development Mode:**
- Allows all localhost origins
- Permissive for development

✅ **Production Mode:**
- Strict origin checking
- Uses environment variables for allowed origins
- Automatic AWS URL detection

✅ **Environment Variables Support:**
- Single or multiple origins
- Custom domain auto-expansion
- AWS-specific URL variables

## 🚨 Common CORS Issues & Solutions

### Issue 1: "Access-Control-Allow-Origin" error
**Solution:** Make sure your `CORS_ORIGIN` includes your actual frontend URL:
```bash
CORS_ORIGIN=https://your-actual-domain.com
```

### Issue 2: Works in development but not production
**Solution:** Check that `NODE_ENV=production` and AWS URLs are set:
```bash
NODE_ENV=production
AWS_FRONTEND_URL=https://your-frontend.com
AWS_API_URL=https://api.your-app.com
```

### Issue 3: Multiple subdomains not working
**Solution:** Use comma-separated origins or custom domain:
```bash
# Option 1: List all origins
CORS_ORIGIN=https://app.domain.com,https://www.app.domain.com,https://api.domain.com

# Option 2: Use custom domain (auto-adds www)
CUSTOM_DOMAIN=domain.com
```

## 📋 Pre-Deployment Checklist

- [ ] AWS environment variables configured in `.env.aws`
- [ ] Database migrated to AWS RDS
- [ ] DNS records pointing to ALB
- [ ] SSL certificates configured
- [ ] CORS origins match your actual domains
- [ ] JWT secrets changed from defaults
- [ ] File upload paths configured (S3 optional)
- [ ] Health checks enabled
- [ ] Monitoring and logging configured

## 🔍 Testing CORS Configuration

Test your CORS setup:

```bash
# Test from browser console on your frontend domain
fetch('https://api.your-app.com/health')
  .then(r => r.json())
  .then(console.log)

# Should work without CORS errors
```

## 📝 Environment Variables Reference

### Required for AWS:
- `CORS_ORIGIN`: Your frontend domain(s)
- `AWS_FRONTEND_URL`: Frontend URL
- `AWS_API_URL`: API Gateway URL
- `NEXT_PUBLIC_API_URL`: Public API URL for frontend
- `DATABASE_URL`: RDS connection string

### Optional for AWS:
- `CUSTOM_DOMAIN`: Auto-expands to https://domain and https://www.domain
- `AWS_INTERNAL_API_URL`: Internal API URL for server-side calls
- `AWS_S3_BUCKET`: For file uploads
- `AWS_REGION`: AWS region

Your application is now ready for AWS deployment with proper CORS handling! 🎉