#!/bin/bash

# ============================================
# Quick Redeploy Script (After Code Changes)
# Run this after pulling new code from git
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/chhattisgarhshadi-backend"

echo -e "${BLUE}=== Quick Redeploy ===${NC}"

cd $APP_DIR

# Pull latest changes
echo -e "${YELLOW}Pulling latest code...${NC}"
git pull origin main

# Install any new dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --production

# Regenerate Prisma client (in case of schema changes)
echo -e "${YELLOW}Regenerating Prisma client...${NC}"
npx prisma generate

# Run migrations if any
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy

# Reload PM2 (zero-downtime reload)
echo -e "${YELLOW}Reloading application...${NC}"
pm2 reload shaadi-api

echo -e "${GREEN}=== Redeploy Complete! ===${NC}"
echo -e "Check status: pm2 status"
echo -e "View logs: pm2 logs shaadi-api"
