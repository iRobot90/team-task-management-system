#!/bin/bash

# Team Task Management System - Deploy to VPS
# This script deploys the application to jesse-test.zng.dk

set -e

# Configuration
VPS_HOST="root@jesse-test.zng.dk"
PROJECT_DIR="/var/www/team-task-management-system"
LOCAL_PROJECT_DIR="$(pwd)"

echo "Starting deployment to VPS: $VPS_HOST"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test SSH connection
print_status "Testing SSH connection to $VPS_HOST..."
if ! ssh -o ConnectTimeout=10 "$VPS_HOST" "echo 'SSH connection successful'"; then
    print_error "Cannot connect to $VPS_HOST via SSH"
    print_error "Please ensure:"
    print_error "1. Your SSH key is added to the server"
    print_error "2. The server is accessible"
    print_error "3. Your SSH config is correct"
    exit 1
fi

# Create a temporary directory on the server
print_status "Creating temporary directory on VPS..."
ssh "$VPS_HOST" "mkdir -p /tmp/ttms_deploy"

# Create tarball excluding node_modules and venv
print_status "Creating optimized deployment archive..."
tar --exclude='node_modules' --exclude='venv' --exclude='__pycache__' --exclude='.git' -czf ttms_deploy.tar.gz backend frontend deploy.sh nginx backend/ttms.service

# Copy archive to VPS
print_status "Copying archive to VPS..."
scp ttms_deploy.tar.gz "$VPS_HOST:/tmp/ttms_deploy/"

# Cleanup local archive
rm ttms_deploy.tar.gz

# Extract and run deployment script on VPS
print_status "Running deployment script on VPS..."
ssh "$VPS_HOST" "cd /tmp/ttms_deploy && tar -xzf ttms_deploy.tar.gz && chmod +x deploy.sh && ./deploy.sh"

# Clean up temporary files
print_status "Cleaning up temporary files..."
ssh "$VPS_HOST" "rm -rf /tmp/ttms_deploy"

print_status "Deployment completed successfully!"
echo ""
echo "Your application should now be available at: http://jesse-test.zng.dk"
echo ""
echo "Next steps:"
echo "1. SSH into your VPS: ssh $VPS_HOST"
echo "2. Configure production settings: nano $PROJECT_DIR/backend/.env"
echo "3. Create Django superuser: sudo -u www-data $PROJECT_DIR/backend/venv/bin/python manage.py createsuperuser"
echo "4. Check service status: systemctl status ttms"
echo ""
echo "To view logs: journalctl -u ttms -f"
