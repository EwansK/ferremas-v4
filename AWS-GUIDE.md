# 🚀 AWS EC2 Deployment Guide for Ferremas E-commerce

This guide will walk you through deploying the Ferremas e-commerce platform on Amazon Web Services (AWS) using an EC2 instance. No prior AWS experience required!

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [EC2 Instance Creation](#ec2-instance-creation)
4. [Database Setup (RDS)](#database-setup-rds)
5. [Domain & SSL Setup](#domain--ssl-setup)
6. [Application Deployment](#application-deployment)
7. [Final Configuration](#final-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You'll Need
- ✅ AWS Account (we'll create this)
- ✅ Credit card for AWS billing
- ✅ Domain name (optional but recommended)
- ✅ Basic computer skills

### Estimated Costs (Monthly)
- **EC2 Instance**: $10-30/month (t3.medium)
- **RDS Database**: $15-25/month (db.t3.micro)
- **Data Transfer**: $5-10/month
- **Total**: ~$30-65/month

---

## AWS Account Setup

### Step 1: Create AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS Account"**
3. Fill in your details:
   - Email address
   - Password
   - AWS account name (e.g., "Ferremas Production")
4. Choose **"Personal"** account type
5. Enter billing information (credit card required)
6. Verify your phone number
7. Select **"Basic Support"** (free)

### Step 2: Security Setup
1. **Enable MFA (Multi-Factor Authentication)**:
   - Go to IAM → Users → Your username
   - Click **"Security credentials"**
   - Click **"Assign MFA device"**
   - Follow the setup with your phone

2. **Create an IAM User** (recommended):
   - Go to IAM → Users → **"Add users"**
   - Username: `ferremas-admin`
   - Access type: **"Programmatic access"** + **"AWS Management Console access"**
   - Permissions: **"AdministratorAccess"**
   - Download the credentials CSV file

---

## EC2 Instance Creation

### Step 1: Launch EC2 Instance
1. **Go to EC2 Dashboard**:
   - Search "EC2" in the AWS console
   - Click **"Launch Instance"**

2. **Choose Amazon Machine Image (AMI)**:
   - Select **"Ubuntu Server 22.04 LTS"**
   - Click **"Select"**

3. **Choose Instance Type**:
   - Select **"t3.medium"** (2 vCPUs, 4 GB RAM)
   - Click **"Next: Configure Instance Details"**

4. **Configure Instance**:
   - Leave defaults
   - Click **"Next: Add Storage"**

5. **Add Storage**:
   - Change size to **20 GB**
   - Storage type: **"General Purpose SSD (gp3)"**
   - Click **"Next: Add Tags"**

6. **Add Tags**:
   - Key: `Name`, Value: `Ferremas-Production`
   - Key: `Environment`, Value: `Production`
   - Click **"Next: Configure Security Group"**

### Step 2: Configure Security Group
1. **Create Security Group**:
   - Security group name: `ferremas-security-group`
   - Description: `Security group for Ferremas e-commerce`

2. **Add Rules**:
   ```
   Type        Protocol    Port Range    Source          Description
   SSH         TCP         22           Your IP          SSH access
   HTTP        TCP         80           0.0.0.0/0        HTTP traffic
   HTTPS       TCP         443          0.0.0.0/0        HTTPS traffic
   Custom      TCP         3000         0.0.0.0/0        API Gateway
   Custom      TCP         3001         0.0.0.0/0        Frontend
   ```

3. Click **"Review and Launch"**

### Step 3: Key Pair Setup
1. **Create Key Pair**:
   - Key pair name: `ferremas-key`
   - Key pair type: **"RSA"**
   - Private key file format: **".pem"**
   - Click **"Download Key Pair"**
   - **⚠️ IMPORTANT**: Save this file safely - you'll need it to access your server

2. Click **"Launch Instances"**

### Step 4: Allocate Elastic IP
1. **Go to Elastic IPs** (in EC2 sidebar)
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select your new IP → **"Actions"** → **"Associate Elastic IP address"**
5. Select your Ferremas instance
6. Click **"Associate"**

---

## Database Setup (RDS)

### Step 1: Create RDS Database
1. **Go to RDS Dashboard**:
   - Search "RDS" in AWS console
   - Click **"Create database"**

2. **Database Creation Method**:
   - Choose **"Standard Create"**

3. **Engine Options**:
   - Engine type: **"PostgreSQL"**
   - Version: **"PostgreSQL 15.4"** (or latest)

4. **Templates**:
   - Choose **"Free tier"** (if eligible) or **"Production"**

5. **Settings**:
   - DB instance identifier: `ferremas-database`
   - Master username: `postgres`
   - Master password: Create a strong password (save it!)
   - Confirm password

6. **DB Instance Class**:
   - Choose **"db.t3.micro"** (free tier) or **"db.t3.small"**

7. **Storage**:
   - Storage type: **"General Purpose SSD (gp2)"**
   - Allocated storage: **20 GB**
   - Enable storage autoscaling: ✅

8. **Connectivity**:
   - VPC: **Default VPC**
   - Publicly accessible: **Yes**
   - VPC security group: **Create new**
   - Security group name: `ferremas-db-sg`

9. **Additional Configuration**:
   - Initial database name: `ferremas`
   - Backup retention: **7 days**
   - Enable automatic backups: ✅

10. Click **"Create database"**

### Step 2: Configure Database Security
1. **Edit Security Group**:
   - Go to EC2 → Security Groups
   - Find `ferremas-db-sg`
   - Add inbound rule:
     - Type: **PostgreSQL**
     - Port: **5432**
     - Source: Select `ferremas-security-group`

---

## Domain & SSL Setup (Optional but Recommended)

### Step 1: Route 53 Setup
1. **Go to Route 53**:
   - Search "Route 53" in AWS console

2. **Create Hosted Zone** (if you have a domain):
   - Domain name: `yourdomain.com`
   - Type: **Public hosted zone**
   - Click **"Create hosted zone"**

3. **Update Nameservers**:
   - Copy the 4 nameservers from Route 53
   - Update them in your domain registrar

### Step 2: Certificate Manager
1. **Go to Certificate Manager**:
   - Search "Certificate Manager"
   - Click **"Request a certificate"**

2. **Request Certificate**:
   - Choose **"Request a public certificate"**
   - Domain names: 
     - `yourdomain.com`
     - `*.yourdomain.com`
   - Validation method: **"DNS validation"**
   - Click **"Request"**

3. **Validate Certificate**:
   - Click on your certificate
   - Click **"Create records in Route 53"**
   - Click **"Create records"**

---

## Application Deployment

### Step 1: Connect to Your EC2 Instance

#### For Windows Users:
1. **Download PuTTY**:
   - Download PuTTY from [putty.org](https://putty.org)
   - Install PuTTY

2. **Convert Key**:
   - Open PuTTYgen
   - Load your `.pem` file
   - Save as `.ppk` file

3. **Connect**:
   - Open PuTTY
   - Host: Your EC2 public IP
   - Port: 22
   - Connection → SSH → Auth → Browse for your `.ppk` file
   - Click **"Open"**
   - Login as: `ubuntu`

#### For Mac/Linux Users:
```bash
# Make key file secure
chmod 400 ferremas-key.pem

# Connect to EC2
ssh -i ferremas-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 2: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Install Node.js (for development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Logout and login again to apply docker group
exit
```

**Reconnect to your EC2 instance after logout**

### Step 3: Clone and Setup Application
```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/ferremas-v4.git
cd ferremas-v4

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# Edit environment files
nano .env
```

### Step 4: Configure Environment Variables

#### Edit `.env` file:
```bash
# Replace with your RDS database details
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@YOUR_RDS_ENDPOINT:5432/ferremas
DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=5432
DB_NAME=ferremas
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD

# Generate strong JWT secrets
JWT_SECRET=your-super-secret-jwt-key-$(openssl rand -hex 32)
JWT_REFRESH_SECRET=your-super-secret-refresh-key-$(openssl rand -hex 32)

# Service ports (keep as is for Docker)
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
MANAGER_SERVICE_PORT=3003
ADMIN_SERVICE_PORT=3004

# File upload path
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS (use your domain or EC2 IP)
CORS_ORIGIN=http://YOUR_DOMAIN_OR_IP:3001

NODE_ENV=production
```

#### Edit `frontend/.env.local`:
```bash
# Use your domain or EC2 public IP
NEXT_PUBLIC_API_URL=http://YOUR_DOMAIN_OR_IP:3000
```

### Step 5: Initialize Database
```bash
# Install PostgreSQL client
sudo apt install postgresql-client -y

# Apply database schema
psql -h YOUR_RDS_ENDPOINT -U postgres -d ferremas -f database-schema.sql

# Load sample data
psql -h YOUR_RDS_ENDPOINT -U postgres -d ferremas -f sample-data.sql
```

### Step 6: Start Application
```bash
# Build and start all services
docker-compose up -d

# Check if all services are running
docker-compose ps

# View logs if needed
docker-compose logs
```

---

## Final Configuration

### Step 1: Set Up Load Balancer (Optional)
1. **Go to EC2 → Load Balancers**
2. **Create Application Load Balancer**:
   - Name: `ferremas-alb`
   - Scheme: **Internet-facing**
   - IP address type: **IPv4**

3. **Configure Listeners**:
   - HTTP: Port 80 → Target port 3001
   - HTTPS: Port 443 → Target port 3001 (if you have SSL)

### Step 2: Set Up Auto Scaling (Optional)
1. **Create Launch Template**
2. **Create Auto Scaling Group**
3. **Configure scaling policies**

### Step 3: Configure Monitoring
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure monitoring
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### Step 4: Set Up Automatic Backups
1. **Database Backups**: Already configured in RDS
2. **Application Backups**:
   ```bash
   # Create backup script
   sudo nano /opt/backup-script.sh
   ```
   
   Add this content:
   ```bash
   #!/bin/bash
   cd /home/ubuntu/ferremas-v4
   tar -czf "/tmp/ferremas-backup-$(date +%Y%m%d).tar.gz" .
   aws s3 cp "/tmp/ferremas-backup-$(date +%Y%m%d).tar.gz" s3://your-backup-bucket/
   ```

### Step 5: Configure Domain (if using)
1. **Update Route 53 Records**:
   - Type: **A Record**
   - Name: `@` (or subdomain)
   - Value: Your Elastic IP

2. **Update CORS in environment**:
   ```bash
   nano .env
   # Change CORS_ORIGIN to your domain
   CORS_ORIGIN=https://yourdomain.com:3001
   ```

---

## Troubleshooting

### Common Issues

#### 1. Services Won't Start
```bash
# Check Docker status
sudo systemctl status docker

# Check logs
docker-compose logs SERVICE_NAME

# Restart specific service
docker-compose restart SERVICE_NAME
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql -h YOUR_RDS_ENDPOINT -U postgres -d ferremas

# Check security groups
# Ensure RDS security group allows connections from EC2
```

#### 3. Port Issues
```bash
# Check if ports are in use
sudo netstat -tlnp | grep :3000

# Check Docker port mapping
docker-compose ps
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h

# Check Docker resources
docker system df

# Clean up unused containers
docker system prune
```

#### 5. SSL Certificate Issues
```bash
# Check certificate status in AWS Certificate Manager
# Ensure DNS validation is complete
# Check Route 53 records
```

### Performance Optimization

#### 1. Enable Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/ferremas

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/ferremas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 2. Set Up Redis Cache (Optional)
```bash
# Add Redis to docker-compose.yml
```

### Security Checklist

- ✅ Use strong passwords for database
- ✅ Enable MFA on AWS account
- ✅ Restrict SSH access to your IP only
- ✅ Use HTTPS in production
- ✅ Keep system updated
- ✅ Monitor logs regularly
- ✅ Set up backup strategy
- ✅ Use environment variables for secrets

### Maintenance Tasks

#### Weekly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check disk space
df -h

# Check Docker logs
docker-compose logs --tail=100
```

#### Monthly Tasks
- Review AWS billing
- Update Docker images
- Check security group rules
- Verify backups are working

---

## 🎉 Congratulations!

Your Ferremas e-commerce platform is now running on AWS! 

### Access Your Application
- **Frontend**: http://YOUR_DOMAIN_OR_IP:3001
- **Admin Panel**: http://YOUR_DOMAIN_OR_IP:3001/admin
- **API**: http://YOUR_DOMAIN_OR_IP:3000

### Default Login Credentials
- **Admin**: admin@ferremas.cl / password123
- **Manager**: manager@ferremas.cl / password123

### Next Steps
1. Change default passwords
2. Configure your domain
3. Set up SSL certificate
4. Configure monitoring
5. Set up regular backups

### Support
- AWS Documentation: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- Docker Documentation: [docs.docker.com](https://docs.docker.com)
- Ferremas Issues: Create an issue in your GitHub repository

---

**⚠️ Important Security Note**: Always change default passwords and keep your system updated!