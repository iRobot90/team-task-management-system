#!/bin/bash

# Team Task Management System - VPS Deployment Script
# This script deploys the application to a VPS

set -e  # Exit on any error

echo "Starting TTMS VPS Deployment..."

# Configuration
PROJECT_DIR="/var/www/team-task-management-system"
BACKUP_DIR="/var/backups/ttms"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup existing deployment if it exists
if [ -d "$PROJECT_DIR" ]; then
    print_status "Backing up existing deployment..."
    tar -czf "$BACKUP_DIR/ttms_backup_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" .
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx curl git

# Create project directory
print_status "Setting up project directory..."
mkdir -p $PROJECT_DIR
chown -R www-data:www-data $PROJECT_DIR

# Stop existing service if running
print_status "Stopping existing service to release file locks..."
systemctl stop ttms || true
sleep 5

# Remove venv from source if it accidentally got included
rm -rf backend/venv

# Copy application files (assuming script is run from project root)
print_status "Copying application files..."
cp -r backend frontend nginx $PROJECT_DIR/
chown -R www-data:www-data $PROJECT_DIR

# Initial configuration variables
DOMAIN="jesse-test.zng.dk"
PROTOCOL="https"
API_URL="${PROTOCOL}://${DOMAIN}/api"


# Setup backend
print_status "Setting up backend..."
cd $PROJECT_DIR/backend

# Create virtual environment
rm -rf venv
sudo -u www-data python3 -m venv venv
sudo -u www-data venv/bin/pip install --upgrade pip
sudo -u www-data venv/bin/pip install -r requirements.txt

# Copy production environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        sudo -u www-data cp .env.production .env
        print_status "Using existing .env.production"
    else
        print_warning "Creating default production .env file"
        cat << EOF | sudo -u www-data tee .env
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
ALLOWED_HOSTS=${DOMAIN},www.${DOMAIN},localhost,127.0.0.1
USE_POSTGRES=True
DB_NAME=ttms_db
DB_USER=ttms_user
DB_PASSWORD=StrongPassword123!
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=${PROTOCOL}://${DOMAIN},${PROTOCOL}://www.${DOMAIN}
EOF
    fi
fi

# Setup PostgreSQL
print_status "Setting up PostgreSQL database..."
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ttms_db; then
    sudo -u postgres createdb ttms_db
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='ttms_user'" | grep -q 1; then
    sudo -u postgres createuser ttms_user
fi

sudo -u postgres psql -c "ALTER USER ttms_user WITH PASSWORD 'StrongPassword123!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ttms_db TO ttms_user;"

# Run Django migrations and collect static files
print_status "Running Django migrations..."
sudo -u www-data venv/bin/python manage.py migrate

print_status "Collecting static files..."
sudo -u www-data venv/bin/python manage.py collectstatic --noinput

# Build frontend
print_status "Building frontend..."
cd $PROJECT_DIR/frontend

# Create frontend .env file
print_status "Configuring frontend environment..."
cat << EOF | sudo -u www-data tee .env
REACT_APP_API_BASE_URL=${API_URL}
EOF

npm install
npm run build

# Setup Gunicorn service
print_status "Setting up Gunicorn service..."
cp $PROJECT_DIR/backend/ttms.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable ttms
systemctl start ttms

# Setup Nginx
print_status "Setting up Nginx..."
cp $PROJECT_DIR/nginx/nginx.conf /etc/nginx/sites-available/ttms
ln -sf /etc/nginx/sites-available/ttms /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    print_status "Nginx configuration reloaded successfully"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Setup SSL with Let's Encrypt (optional)
read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
    
    print_status "Requesting SSL certificate..."
    certbot --nginx -d jesse-test.zng.dk -d www.jesse-test.zng.dk
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
fi

# Create log directories
mkdir -p /var/log/gunicorn
chown www-data:www-data /var/log/gunicorn

# Create run directory for gunicorn
mkdir -p /var/run/gunicorn
chown www-data:www-data /var/run/gunicorn

# Restart services
print_status "Restarting services..."
systemctl restart ttms
systemctl restart nginx

# Show service status
print_status "Service status:"
systemctl status ttms --no-pager
systemctl status nginx --no-pager

echo ""
print_status "Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit $PROJECT_DIR/backend/.env with your production settings"
echo "2. Create a Django superuser: sudo -u www-data $PROJECT_DIR/backend/venv/bin/python manage.py createsuperuser"
echo "3. Configure your domain DNS to point to this server"
echo "4. Test the application at http://jesse-test.zng.dk"
echo ""
echo "Useful commands:"
echo "- View logs: journalctl -u ttms -f"
echo "- Restart TTMS: systemctl restart ttms"
echo "- Restart Nginx: systemctl restart nginx"
