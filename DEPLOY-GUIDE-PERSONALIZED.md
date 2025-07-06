# 🚀 Personalized AWS Deployment Guide for EWansK's Ferremas

This guide contains your exact configuration values and ready-to-use commands for deploying Ferremas to AWS.

## 📋 Your Configuration Summary

- **GitHub**: `EWansK/ferremas-v4`
- **EC2 IP**: `54.211.97.52`
- **RDS Endpoint**: `ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com`
- **Environment**: `staging`
- **Region**: `us-east-1`

---

## 🔑 Step 1: Connect to Your EC2 Instance

### Mac/Linux Users:
```bash
# Make your key file secure
chmod 400 ferremas-key.pem

# Connect to your EC2 instance
ssh -i ferremas-key.pem ubuntu@54.211.97.52
```

### Windows Users (PuTTY):
- **Host**: `54.211.97.52`
- **Port**: `22`
- **Auth**: Browse for your converted `.ppk` file
- **Username**: `ubuntu`

---

## 🛠️ Step 2: Install Dependencies on EC2

Once connected to EC2, run these commands:

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

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
sudo apt install postgresql-client -y

# Logout and login again to apply Docker permissions
exit
```

**Reconnect to EC2:**
```bash
ssh -i ferremas-key.pem ubuntu@54.211.97.52
```

---

## 📥 Step 3: Clone Your Repository

```bash
# Clone your Ferremas repository
git clone https://github.com/EWansK/ferremas-v4.git
cd ferremas-v4

# Verify you're in the right directory
pwd
ls
```

---

## ⚙️ Step 4: Configure Environment Variables

Create your production environment files:

### Main Environment File (.env):
```bash
cat > .env << 'EOF'
# Database Configuration - Your RDS
DATABASE_URL=postgresql://postgres:Conejo1246!!@ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com:5432/ferremas
DB_HOST=ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=ferremas
DB_USER=postgres
DB_PASSWORD=Conejo1246!!

# JWT Configuration - Generated for staging
JWT_SECRET=ewansk-staging-jwt-secret-key-2024-super-secure
JWT_REFRESH_SECRET=ewansk-staging-refresh-secret-key-2024-ultra-secure

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
MANAGER_SERVICE_PORT=3003
ADMIN_SERVICE_PORT=3004

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration - Your EC2 IP
CORS_ORIGIN=http://54.211.97.52:3001

# Environment
NODE_ENV=staging

# Admin Configuration
ADMIN_EMAIL=ewanskurt@gmail.com
AWS_REGION=us-east-1
EOF
```

### Frontend Environment File:
```bash
cat > frontend/.env.local << 'EOF'
# Frontend Configuration - Your EC2 IP
NEXT_PUBLIC_API_URL=http://54.211.97.52:3000
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_ADMIN_EMAIL=ewanskurt@gmail.com
EOF
```

---

## 🗄️ Step 5: Initialize Your Database

Connect to your RDS instance and set up the database:

```bash
# Test connection to RDS
psql -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres -d ferremas -c "SELECT version();"

# Create database schema
psql -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres -d ferremas -f database-schema.sql

# Load sample data
psql -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres -d ferremas -f sample-data.sql

# Verify data was loaded
psql -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres -d ferremas -c "SELECT COUNT(*) FROM users;"
```

**Password**: `Conejo1246!!` (when prompted)

---

## 🚀 Step 6: Deploy the Application

```bash
# Start all services
docker-compose up -d

# Wait for services to start (2-3 minutes)
sleep 120

# Check service status
docker-compose ps

# View logs to ensure everything started correctly
docker-compose logs --tail=50
```

---

## 🌐 Step 7: Access Your Application

Your Ferremas e-commerce platform is now live at:

### 🏠 Main Website:
**URL**: http://54.211.97.52:3001

### 👑 Admin Panel:
**URL**: http://54.211.97.52:3001/admin
- **Username**: `admin@ferremas.cl`
- **Password**: `password123`

### 👨‍💼 Manager Panel:
**URL**: http://54.211.97.52:3001/manager
- **Username**: `manager@ferremas.cl`  
- **Password**: `password123`

### 🛒 Customer Account:
**URL**: http://54.211.97.52:3001
- **Username**: `cliente1@gmail.com`
- **Password**: `password123`

### 🔌 API Gateway:
**URL**: http://54.211.97.52:3000
- Test endpoint: http://54.211.97.52:3000/health

---

## ✅ Step 8: Verify Deployment

Run these verification commands:

```bash
# Check all services are running
docker-compose ps

# Test API connectivity
curl http://54.211.97.52:3000/health

# Test frontend connectivity
curl -I http://54.211.97.52:3001

# Check database connectivity
psql -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres -d ferremas -c "SELECT COUNT(*) FROM products;"

# View recent logs
docker-compose logs --tail=20 --timestamps
```

---

## 🔧 Management Commands

### Start/Stop Services:
```bash
# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Restart specific service
docker-compose restart frontend
docker-compose restart api-gateway
```

### View Logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f auth-service
```

### Update Application:
```bash
# Pull latest changes from your GitHub
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose up -d --build

# Or update specific service
docker-compose up -d --build frontend
```

---

## 🔍 Troubleshooting

### If Services Won't Start:
```bash
# Check Docker status
sudo systemctl status docker

# Check available disk space
df -h

# Check memory usage
free -h

# Restart Docker if needed
sudo systemctl restart docker
docker-compose up -d
```

### If Database Connection Fails:
```bash
# Test RDS connectivity
telnet ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com 5432

# Check environment variables
cat .env | grep DATABASE

# Check RDS security group allows EC2 access
```

### If Frontend Doesn't Load:
```bash
# Check frontend logs
docker-compose logs frontend

# Verify environment file
cat frontend/.env.local

# Restart frontend service
docker-compose restart frontend
```

---

## 🔐 Security Notes

### Change Default Passwords:
Once everything is working, update these:

```bash
# Connect to database and update admin password
psql -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres -d ferremas

# In psql, run:
UPDATE users SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf')) 
WHERE email = 'admin@ferremas.cl';
\q
```

### Firewall Configuration:
Your EC2 security group should allow:
- **SSH (22)**: Your IP only
- **HTTP (80)**: 0.0.0.0/0
- **HTTPS (443)**: 0.0.0.0/0  
- **API (3000)**: 0.0.0.0/0
- **Frontend (3001)**: 0.0.0.0/0

---

## 📊 Monitoring

### Check Application Health:
```bash
# System resources
top
htop  # if installed

# Docker stats
docker stats

# Service status
docker-compose ps
```

### Application Logs:
```bash
# Real-time logs
docker-compose logs -f

# Error logs only
docker-compose logs | grep -i error

# Export logs
docker-compose logs > deployment-logs.txt
```

---

## 🔄 Backup Procedures

### Database Backup:
```bash
# Create backup
pg_dump -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres ferremas > backup-$(date +%Y%m%d).sql

# Restore from backup (if needed)
psql -h ferremas.c8z8saosywra.us-east-1.rds.amazonaws.com -U postgres ferremas < backup-20241206.sql
```

### Application Backup:
```bash
# Backup uploaded files
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup configuration
cp .env .env.backup
cp frontend/.env.local frontend/.env.local.backup
```

---

## 🎯 Testing Your Deployment

### 1. Test User Registration:
- Go to: http://54.211.97.52:3001/auth/register
- Create a new customer account
- Verify you can login

### 2. Test Product Management:
- Login as manager: `manager@ferremas.cl`
- Go to: http://54.211.97.52:3001/manager
- Try adding/editing products

### 3. Test Admin Functions:
- Login as admin: `admin@ferremas.cl`  
- Go to: http://54.211.97.52:3001/admin
- Try managing users

### 4. Test Shopping Cart:
- Browse products as customer
- Add items to cart
- Test checkout process

---

## 🚀 Next Steps

### 1. Domain Setup (Optional):
If you get a domain name later:
1. Point domain to `54.211.97.52`
2. Update environment variables
3. Set up SSL certificate

### 2. SSL Certificate:
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx
```

### 3. Monitoring Setup:
- CloudWatch agent installation
- Log monitoring
- Performance alerts

### 4. CI/CD Pipeline:
- GitHub Actions for automatic deployment
- Automated testing on updates

---

## 📞 Support

Your application is now live! If you encounter issues:

1. **Check logs**: `docker-compose logs`
2. **Verify services**: `docker-compose ps`
3. **Test connectivity**: Use the curl commands above
4. **Database issues**: Check RDS security groups

### Your Live URLs:
- **Website**: http://54.211.97.52:3001
- **Admin**: http://54.211.97.52:3001/admin  
- **API**: http://54.211.97.52:3000

**🎉 Congratulations! Your Ferremas e-commerce platform is now running on AWS!**