#!/bin/bash

# SSH Setup Script for VPS Deployment
# This script adds your SSH key to the VPS

set -e

# Configuration
VPS_HOST="root@jesse-test.zng.dk"
SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICvGHeXXCUZqGlCjtk1NwXLSetC/xehFeeSaAu/77mdd amiandajesse27.com"

echo "Setting up SSH access to VPS: $VPS_HOST"

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

# Test if we can connect to VPS
print_status "Testing connection to $VPS_HOST..."
if ! ssh -o ConnectTimeout=10 -o PasswordAuthentication=yes "$VPS_HOST" "echo 'Connection successful'" 2>/dev/null; then
    print_warning "Cannot connect with SSH key, trying password authentication..."
    print_warning "You will be prompted for the root password"
fi

# Add SSH key to VPS
print_status "Adding SSH key to VPS..."
ssh -o PasswordAuthentication=yes "$VPS_HOST" << 'EOF'
    # Create .ssh directory if it doesn't exist
    mkdir -p ~/.ssh
    
    # Add the SSH key to authorized_keys
    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICvGHeXXCUZqGlCjtk1NwXLSetC/xehFeeSaAu/77mdd amiandajesse27.com" >> ~/.ssh/authorized_keys
    
    # Set correct permissions
    chmod 700 ~/.ssh
    chmod 600 ~/.ssh/authorized_keys
    
    echo "SSH key added successfully!"
EOF

# Test SSH key authentication
print_status "Testing SSH key authentication..."
if ssh -o PasswordAuthentication=no "$VPS_HOST" "echo 'SSH key authentication successful!'"; then
    print_status "SSH setup completed successfully!"
    echo ""
    echo "You can now deploy to your VPS using:"
    echo "./deploy_to_vps.sh"
else
    print_error "SSH key authentication failed"
    print_error "Please check the SSH key and try again"
fi
