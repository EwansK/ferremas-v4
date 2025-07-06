# 📚 GitHub Guide for Ferremas E-commerce

This guide will help you download and run the Ferremas e-commerce platform on your computer, even if you've never used GitHub before!

## 📋 Table of Contents
1. [What is GitHub?](#what-is-github)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Installation](#step-by-step-installation)
4. [Running the Project](#running-the-project)
5. [Troubleshooting](#troubleshooting)
6. [Next Steps](#next-steps)

---

## What is GitHub?

GitHub is like a "library" for computer code where developers share their projects. Think of it as Google Drive, but specifically designed for software projects. The Ferremas e-commerce platform is stored there, and you can download it to your computer for free!

---

## Prerequisites

Before we start, you'll need to install some programs on your computer. Don't worry - they're all free!

### 1. Install Git (Required)
Git is a tool that helps you download code from GitHub.

#### For Windows:
1. Go to [git-scm.com](https://git-scm.com/download/windows)
2. Click "Download for Windows"
3. Run the downloaded file
4. During installation, use all the default settings (just keep clicking "Next")
5. When asked about "default editor," you can choose "Notepad" if you're unsure

#### For Mac:
1. Open "Terminal" (press Cmd+Space, type "terminal", press Enter)
2. Type this command and press Enter:
   ```bash
   git --version
   ```
3. If Git isn't installed, your Mac will ask if you want to install it - click "Yes"

#### For Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install git
```

### 2. Install Docker (Required)
Docker helps run the Ferremas application easily.

#### For Windows:
1. Go to [docker.com](https://www.docker.com/products/docker-desktop/)
2. Click "Download for Windows"
3. Run the installer
4. Restart your computer when prompted
5. Open Docker Desktop and wait for it to start

#### For Mac:
1. Go to [docker.com](https://www.docker.com/products/docker-desktop/)
2. Click "Download for Mac"
3. Choose the version for your Mac (Intel or Apple Silicon)
4. Drag Docker to your Applications folder
5. Open Docker from Applications

#### For Linux:
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```
Then logout and login again.

### 3. Verify Installation
Open your terminal/command prompt and type these commands to make sure everything is installed:

```bash
git --version
docker --version
```

You should see version numbers. If you get errors, the installation didn't work properly.

---

## Step-by-Step Installation

### Step 1: Choose a Location for Your Project
First, decide where you want to store the Ferremas project on your computer.

#### For Windows:
1. Open File Explorer
2. Go to your Documents folder (or create a new folder like "Projects")
3. Remember this location - you'll need it!

#### For Mac/Linux:
Most people put projects in their home directory or create a "Projects" folder.

### Step 2: Open Terminal/Command Prompt

#### For Windows:
1. Press Windows key + R
2. Type `cmd` and press Enter
3. You'll see a black window - this is the command prompt

#### For Mac:
1. Press Cmd + Space
2. Type "terminal" and press Enter

#### For Linux:
1. Press Ctrl + Alt + T

### Step 3: Navigate to Your Chosen Location
In the terminal, type commands to go to where you want to download the project:

#### For Windows:
```bash
cd Documents
```
(Replace "Documents" with your chosen folder)

#### For Mac/Linux:
```bash
cd ~
# or
cd ~/Documents
# or create a projects folder
mkdir Projects
cd Projects
```

### Step 4: Download the Ferremas Project
Now we'll "clone" (download) the project from GitHub:

```bash
git clone https://github.com/YOUR_USERNAME/ferremas-v4.git
```

**Important**: Replace `YOUR_USERNAME` with the actual GitHub username where the project is stored!

You'll see something like:
```
Cloning into 'ferremas-v4'...
remote: Enumerating objects: 150, done.
remote: Total 150 (delta 0), reused 0 (delta 0)
Receiving objects: 100% (150/150), done.
```

### Step 5: Enter the Project Folder
```bash
cd ferremas-v4
```

### Step 6: Look Around (Optional)
You can see what files were downloaded:

#### For Windows:
```bash
dir
```

#### For Mac/Linux:
```bash
ls
```

You should see folders like `frontend`, `services`, and files like `README.md`.

---

## Running the Project

### Step 1: Set Up Environment Variables
The project needs some configuration files. Don't worry - we've prepared examples for you!

```bash
# Copy the example environment file
cp .env.example .env

# Copy the frontend environment file  
cp frontend/.env.example frontend/.env.local
```

#### For Windows (if the above doesn't work):
```bash
copy .env.example .env
copy frontend\.env.example frontend\.env.local
```

### Step 2: Start the Application
This is the magic command that starts everything:

```bash
docker-compose up -d
```

You'll see Docker downloading and starting various services. This might take 5-10 minutes the first time.

You'll see output like:
```
Creating ferremas-postgres ... done
Creating ferremas-api-gateway ... done
Creating ferremas-frontend ... done
```

### Step 3: Set Up the Database
The first time you run the project, you need to set up the database:

```bash
# Wait for services to start (about 2 minutes)
# Then set up the database
docker exec ferremas-postgres psql -U postgres -d ferremas -c "\i /docker-entrypoint-initdb.d/database-schema.sql"
```

If that doesn't work, try:
```bash
docker exec -i ferremas-postgres psql -U postgres -d ferremas < database-schema.sql
```

### Step 4: Load Sample Data
```bash
docker exec -i ferremas-postgres psql -U postgres -d ferremas < sample-data.sql
```

### Step 5: Check if Everything is Working
Open your web browser and go to:

- **Main Website**: [http://localhost:3001](http://localhost:3001)
- **Admin Panel**: [http://localhost:3001/admin](http://localhost:3001/admin)

### Step 6: Login and Test
Use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ferremas.cl | password123 |
| Manager | manager@ferremas.cl | password123 |
| Customer | cliente1@gmail.com | password123 |

---

## Troubleshooting

### Problem: "git: command not found"
**Solution**: Git isn't installed properly. Go back to the Prerequisites section and reinstall Git.

### Problem: "docker: command not found"
**Solution**: Docker isn't installed or running. Make sure Docker Desktop is open and running.

### Problem: "Permission denied"
**Solution for Mac/Linux**: Add `sudo` before the command:
```bash
sudo docker-compose up -d
```

### Problem: "Port already in use"
**Solution**: Something else is using the same port. Try:
```bash
docker-compose down
docker-compose up -d
```

### Problem: Website doesn't load
**Possible Solutions**:
1. Wait 2-3 minutes for all services to start
2. Check if Docker is running: `docker-compose ps`
3. Restart everything:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Problem: Database errors
**Solution**: Reset the database:
```bash
docker-compose down
docker volume rm ferremas-v4_postgres_data
docker-compose up -d
# Wait 2 minutes, then run database setup commands again
```

### Problem: "No space left on device"
**Solution**: Docker is using too much disk space:
```bash
docker system prune -a
```

### Problem: Services won't start on Windows
**Solution**: 
1. Make sure Docker Desktop is running
2. Make sure virtualization is enabled in your BIOS
3. Try restarting Docker Desktop

---

## Next Steps

### Stopping the Application
When you're done testing, you can stop the application:
```bash
docker-compose down
```

### Starting Again Later
To start the application again later:
```bash
cd ferremas-v4
docker-compose up -d
```

### Updating the Project
If the project gets updated on GitHub, you can download the latest version:
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Learning More
Now that you have the project running, you might want to:

1. **Read the main README.md** - Learn about the project structure
2. **Check SETUP.md** - More detailed setup instructions
3. **Read TESTING-PLAN.md** - Learn how to test the application
4. **Explore the code** - Look at the files in the `frontend` and `services` folders

### Making Changes
If you want to modify the code:

1. **Never edit files directly in the main project**
2. **Create a "fork" on GitHub first** (this makes your own copy)
3. **Learn about Git branches** before making changes
4. **Always test your changes** using the testing guide

---

## 🎉 Congratulations!

You've successfully downloaded and run the Ferremas e-commerce platform! Here's what you've accomplished:

✅ Installed Git and Docker  
✅ Downloaded the project from GitHub  
✅ Started all the microservices  
✅ Set up the database  
✅ Logged into the admin panel  

### What's Running?
- **Frontend**: The website customers see
- **API Gateway**: Routes requests to the right service
- **Auth Service**: Handles user login/registration
- **Product Service**: Manages the product catalog
- **Manager Service**: Handles inventory management
- **Admin Service**: Manages users and system settings
- **Database**: Stores all the data

### File Structure Overview
```
ferremas-v4/
├── frontend/          # Website interface (React/Next.js)
├── services/          # Backend services (Node.js)
│   ├── api-gateway/   # Main entry point
│   ├── auth-service/  # User authentication
│   ├── product-service/ # Product management
│   ├── manager-service/ # Inventory management
│   └── admin-service/   # Admin operations
├── database-schema.sql # Database structure
├── sample-data.sql    # Test data
└── docker-compose.yml # Service configuration
```

---

## 🆘 Getting Help

### If You're Stuck
1. **Read the error message carefully** - it usually tells you what's wrong
2. **Check the troubleshooting section above**
3. **Google the error message** - someone else has probably had the same problem
4. **Ask for help** on the project's GitHub issues page

### Common Beginner Mistakes
❌ **Not waiting for services to start** - Give it 2-3 minutes  
❌ **Forgetting to start Docker** - Make sure Docker Desktop is running  
❌ **Using the wrong URL** - Use `localhost`, not `127.0.0.1`  
❌ **Not copying environment files** - You need the `.env` files  

### Useful Commands to Remember
```bash
# Check what's running
docker-compose ps

# See logs if something's not working
docker-compose logs

# Stop everything
docker-compose down

# Start everything
docker-compose up -d

# Update from GitHub
git pull origin main
```

---

## 🚀 You're Ready!

You now have a complete e-commerce platform running on your computer! You can:

- Browse products as a customer
- Manage inventory as a manager  
- Administer users as an admin
- Test the shopping cart and checkout process
- Explore the code and learn how it works

**Happy coding!** 🎈