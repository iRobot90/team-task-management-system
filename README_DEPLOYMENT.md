# Team Task Management System - VPS Deployment Guide

This guide will help you deploy the Team Task Management System on a VPS using Ubuntu/Debian.

## Prerequisites

- Ubuntu 20.04+ or Debian 10+ VPS
- Domain name pointed to your VPS IP
- SSH access to the VPS with sudo privileges
- At least 2GB RAM and 20GB storage

## Quick Deployment

1. **Clone the repository to your VPS:**
   ```bash
   git clone <your-repository-url>
   cd team-task-management-system
   ```

2. **Make the deployment script executable:**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run the deployment script:**
   ```bash
   sudo ./deploy.sh
   ```

4. **Configure production settings:**
   ```bash
   sudo nano /var/www/team-task-management-system/backend/.env
   ```

5. **Create Django superuser:**
   ```bash
   sudo -u www-data /var/www/team-task-management-system/backend/venv/bin/python manage.py createsuperuser
   ```

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx curl git
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE ttms_db;
CREATE USER ttms_user WITH PASSWORD 'StrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE ttms_db TO ttms_user;
\q
```

### 3. Application Setup

```bash
# Create project directory
sudo mkdir -p /var/www/team-task-management-system
sudo chown www-data:www-data /var/www/team-task-management-system

# Copy application files
sudo cp -r backend frontend /var/www/team-task-management-system/
sudo chown -R www-data:www-data /var/www/team-task-management-system

# Setup backend virtual environment
cd /var/www/team-task-management-system/backend
sudo -u www-data python3 -m venv venv
sudo -u www-data venv/bin/pip install -r requirements.txt

# Copy and configure environment file
sudo -u www-data cp .env.production .env
sudo nano .env  # Edit with your production settings
```

### 4. Django Setup

```bash
# Run migrations
sudo -u www-data venv/bin/python manage.py migrate

# Collect static files
sudo -u www-data venv/bin/python manage.py collectstatic --noinput

# Create superuser
sudo -u www-data venv/bin/python manage.py createsuperuser
```

### 5. Frontend Build

```bash
cd /var/www/team-task-management-system/frontend
sudo -u www-data npm install
sudo -u www-data npm run build
```

### 6. Gunicorn Service

```bash
# Copy service file
sudo cp /var/www/team-task-management-system/backend/ttms.service /etc/systemd/system/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ttms
sudo systemctl start ttms
```

### 7. Nginx Configuration

```bash
# Copy Nginx config
sudo cp /var/www/team-task-management-system/nginx/nginx.conf /etc/nginx/sites-available/ttms

# Enable site
sudo ln -sf /etc/nginx/sites-available/ttms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL Setup (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d jesse-test.zng.dk -d www.jesse-test.zng.dk

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Configuration Files

### Environment Variables (.env)

Key settings in `/var/www/team-task-management-system/backend/.env`:

```bash
SECRET_KEY=your_very_secure_secret_key_here
DEBUG=False
ALLOWED_HOSTS=jesse-test.zng.dk,www.jesse-test.zng.dk
DB_NAME=ttms_db
DB_USER=ttms_user
DB_PASSWORD=StrongPassword123!
DB_HOST=localhost
```

### Gunicorn Configuration

The Gunicorn configuration is in `gunicorn.conf.py` with optimized settings for production.

### Nginx Configuration

The Nginx configuration handles:
- Frontend static files serving
- Backend API proxying
- SSL termination
- Security headers
- Gzip compression

## Service Management

### Useful Commands

```bash
# Check TTMS service status
sudo systemctl status ttms

# View TTMS logs
sudo journalctl -u ttms -f

# Restart TTMS
sudo systemctl restart ttms

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

### Log Locations

- TTMS application logs: `/var/log/gunicorn/ttms_error.log`
- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`
- System service logs: `journalctl -u ttms`

## Security Considerations

1. **Change default passwords** - Update the database password and Django secret key
2. **Firewall setup** - Configure UFW to allow only necessary ports
3. **Regular updates** - Keep system packages updated
4. **SSL/TLS** - Always use HTTPS in production
5. **Backup strategy** - Regular database and file backups

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Check if Gunicorn is running
2. **Database connection errors**: Verify PostgreSQL is running and credentials are correct
3. **Static files not loading**: Run `collectstatic` and check Nginx configuration
4. **Permission errors**: Ensure www-data user owns the project files

### Debug Steps

1. Check service status: `sudo systemctl status ttms nginx`
2. View logs: `sudo journalctl -u ttms -f`
3. Test Gunicorn directly: `curl http://127.0.0.1:8000/api/`
4. Check database connection: `sudo -u www-data /var/www/team-task-management-system/backend/venv/bin/python manage.py dbshell`

## Performance Optimization

1. **Database optimization** - Configure PostgreSQL settings
2. **Caching** - Consider Redis for caching
3. **CDN** - Use CDN for static assets
4. **Monitoring** - Set up monitoring tools like Prometheus/Grafana

## Backup Strategy

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup_ttms.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump ttms_db > /var/backups/ttms_db_$DATE.sql
find /var/backups -name "ttms_db_*.sql" -mtime +7 -delete
```

```bash
# Make executable and schedule
sudo chmod +x /usr/local/bin/backup_ttms.sh
echo "0 2 * * * /usr/local/bin/backup_ttms.sh" | sudo crontab -
```

### Files Backup

```bash
# Backup application files
sudo tar -czf /var/backups/ttms_files_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/team-task-management-system
```

## Support

If you encounter issues during deployment:

1. Check the logs for error messages
2. Verify all configuration files are correct
3. Ensure all services are running
4. Check network connectivity and DNS settings

For additional support, refer to the Django and Nginx documentation.
