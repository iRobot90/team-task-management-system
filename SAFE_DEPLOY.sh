#!/bin/bash

# Safe Deployment Steps for VPS
# This guide ensures we don't crash the production server

echo "=================================="
echo "SAFE DEPLOYMENT CHECKLIST"
echo "=================================="
echo ""

# Step 1: Local Verification
echo "✓ Step 1: Run Local Verification"
echo "   ./verify_changes.sh"
echo "   Ensure all tests pass before proceeding"
echo ""

# Step 2: Commit Changes
echo "✓ Step 2: Commit Changes to Git"
echo "   git add -A"
echo "   git commit -m 'feat: mobile UI improvements and accessibility fixes'"
echo ""

#Step 3: Check Current Branch
echo "✓ Step 3: Check Current Branch"
echo "   git branch"
echo "   You should be on: feature/mobile-ui-accessibility"
echo ""

# Step 4: Deploy to VPS
echo "✓ Step 4: Deploy to VPS (with automatic backup)"
echo "   ./deploy_to_vps.sh"
echo "   This script will:"
echo "   - Create a backup of current deployment"
echo "   - Transfer new files to VPS"
echo "   - Run migrations safely"
echo "   - Restart services with zero-downtime"
echo ""

# Step 5: Monitor Deployment
echo "✓ Step 5: Monitor VPS Server"
echo "   ssh your-vps-user@your-vps-ip"
echo "   sudo systemctl status gunicorn"
echo "   sudo systemctl status nginx"
echo "   Check logs: sudo journalctl -u gunicorn -n 50"
echo ""

# Step 6: Rollback if Needed
echo "✓ Step 6: Rollback Plan (if something goes wrong)"
echo "   The deploy.sh creates backups in ~/backups/"
echo "   To rollback:"
echo "   ssh to VPS"
echo "   cd ~/backups"
echo "   Find latest backup: ls -lt"
echo "   Restore: tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz -C /var/www/ttms"
echo "   sudo systemctl restart gunicorn"
echo ""

echo "==================================" 
echo "PRODUCTION .env REQUIREMENTS"
echo "=================================="
echo ""
echo "Ensure your VPS has /var/www/ttms/backend/.env.production with:"
echo ""
echo "DEBUG=False"
echo "SECRET_KEY=<your-production-secret-key>"
echo "ALLOWED_HOSTS=your-domain.com,your-vps-ip"
echo "CORS_ALLOWED_ORIGINS=https://your-domain.com"
echo "USE_POSTGRES=True"
echo "DB_NAME=ttms_db"
echo "DB_USER=postgres"
echo "DB_PASSWORD=<your-db-password>"
echo "DB_HOST=localhost"
echo "DB_PORT=5432"
echo ""
echo "=================================="

