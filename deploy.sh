#!/bin/bash

# ============================================
# Chhattisgarh Shaadi Backend - Deployment Script
# For Hostinger KVM 4 VPS (Ubuntu 22.04+)
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Chhattisgarh Shaadi Backend Deployment${NC}"
echo -e "${BLUE}============================================${NC}"

# Configuration
APP_NAME="shaadi-api"
APP_DIR="/var/www/chhattisgarhshadi-backend"
NODE_VERSION="20"
DOMAIN="api.chhattisgarhshadi.com"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use: sudo bash deploy.sh)${NC}"
  exit 1
fi

# Step 1: Update System
echo -e "\n${YELLOW}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 2: Install Node.js 20 LTS
echo -e "\n${YELLOW}[2/8] Installing Node.js ${NODE_VERSION} LTS...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | cut -dv -f2) -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}Node.js $(node -v) installed${NC}"
else
    echo -e "${GREEN}Node.js $(node -v) already installed${NC}"
fi

# Step 3: Install Redis
echo -e "\n${YELLOW}[3/8] Installing Redis...${NC}"
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
echo -e "${GREEN}Redis installed and running${NC}"

# Step 4: Install PM2
echo -e "\n${YELLOW}[4/8] Installing PM2 process manager...${NC}"
npm install -g pm2
echo -e "${GREEN}PM2 installed${NC}"

# Step 5: Install Nginx
echo -e "\n${YELLOW}[5/8] Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
systemctl start nginx
echo -e "${GREEN}Nginx installed and running${NC}"

# Step 6: Install Certbot for SSL
echo -e "\n${YELLOW}[6/8] Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}Certbot installed${NC}"

# Step 7: Setup Application
echo -e "\n${YELLOW}[7/8] Setting up application...${NC}"

# Create app directory if it doesn't exist
mkdir -p $APP_DIR

# Check if we're in the app directory or need to navigate
if [ -f "package.json" ]; then
    echo "Already in app directory, copying files..."
    cp -r . $APP_DIR/
else
    echo -e "${YELLOW}Please ensure you've cloned the repo to $APP_DIR${NC}"
    echo -e "${YELLOW}Run: git clone <repo-url> $APP_DIR${NC}"
fi

cd $APP_DIR

# Install dependencies
echo "Installing npm dependencies..."
npm install --production

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Step 8: Configure Nginx
echo -e "\n${YELLOW}[8/8] Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
server {
    listen 80;
    server_name api.chhattisgarhshadi.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size (for profile photos)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.io support
    location /socket.io/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx
echo -e "${GREEN}Nginx configured${NC}"

# Configure firewall
echo -e "\n${YELLOW}Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo -e "${GREEN}Firewall configured${NC}"

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}  Initial Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo -e ""
echo -e "1. ${BLUE}Create your production .env file:${NC}"
echo -e "   nano $APP_DIR/.env"
echo -e ""
echo -e "2. ${BLUE}Point your subdomain to this VPS:${NC}"
echo -e "   Create an A record: api.chhattisgarhshadi.com -> YOUR_VPS_IP"
echo -e ""
echo -e "3. ${BLUE}Setup SSL (after DNS propagates):${NC}"
echo -e "   certbot --nginx -d $DOMAIN"
echo -e ""
echo -e "4. ${BLUE}Start the application:${NC}"
echo -e "   cd $APP_DIR && pm2 start ecosystem.config.cjs"
echo -e "   pm2 save"
echo -e "   pm2 startup"
echo -e ""
echo -e "5. ${BLUE}Verify the deployment:${NC}"
echo -e "   curl https://$DOMAIN/api/v1/health"
echo -e ""
