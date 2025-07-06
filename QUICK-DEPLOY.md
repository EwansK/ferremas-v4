# ⚡ Quick Deploy Guide for EWansK

Your **copy-paste ready** deployment commands with real values!

## 🔑 Connect to EC2

```bash
chmod 400 ferremas-key.pem
ssh -i ferremas-key.pem ubuntu@54.211.97.52
```

## 🛠️ Install Dependencies (Run on EC2)

```bash
# Update system and install everything
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git and PostgreSQL client
sudo apt install git postgresql-client htop -y

# Logout and reconnect
exit
```

**Reconnect:**
```bash
ssh -i ferremas-key.pem ubuntu@54.211.97.52
```

## 📥 Clone and Setup

```bash
# Clone your repository
git clone https://github.com/EWansK/ferremas-v4.git
cd ferremas-v4

# Make scripts executable
chmod +x *.sh

# Setup environment files
./setup-ewansk-env.sh

# Initialize database
./init-database.sh

# Start application
./start-ferremas.sh
```

## 🌐 Your Live URLs

- **Website**: http://54.211.97.52:3001
- **Admin**: http://54.211.97.52:3001/admin
- **API**: http://54.211.97.52:3000

## 🔑 Test Accounts

- **Admin**: admin@ferremas.cl / password123
- **Manager**: manager@ferremas.cl / password123
- **Customer**: cliente1@gmail.com / password123

## 🔧 Management Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Start services
docker-compose up -d

# Restart specific service
docker-compose restart frontend
```

That's it! Your e-commerce platform should be live! 🎉