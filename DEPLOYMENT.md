# Deployment Guide - Team Task Management System

This guide provides step-by-step instructions for deploying the TTMS application on a DigitalOcean VPS using Nginx, Gunicorn, and PostgreSQL.

## Prerequisites

- DigitalOcean VPS (Ubuntu 22.04 LTS recommended)
- Domain name (optional, can use IP address)
- SSH access to the server
- Basic knowledge of Linux commands
 - Basic knowledge of Linux commands
 - Server credentials provided by administrator

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx git
```

### 2. Create System User

```bash
# Create a user for running the application
sudo adduser --disabled-password --gecos "" ttms
sudo usermod -aG sudo ttms
```

### 3. PostgreSQL Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE ttms_db;
CREATE USER ttms_user WITH PASSWORD 'your_secure_password_here';
ALTER ROLE ttms_user SET client_encoding TO 'utf8';
ALTER ROLE ttms_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ttms_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ttms_db TO ttms_user;
\q
```

## Backend Deployment

### 1. Clone Repository

```bash
# Switch to ttms user
sudo su - ttms

# Clone the repository
cd /home/ttms
git clone https://github.com/iRobot90/team-task-management-system.git
cd team-task-management-system
git checkout backend
cd backend
```

### 2. Set Up Python Environment

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following content (adjust values as needed):

```env
SECRET_KEY=your-django-secret-key-here-generate-with-openssl-rand-hex-32
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-server-ip
USE_POSTGRES=True
DB_NAME=ttms_db
DB_USER=ttms_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=https://your-domain.com,http://your-server-ip
```

Generate a secure secret key:
```bash
openssl rand -hex 32
```

## Run migrations and initial setup

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py migrate

# Initialize roles
python manage.py init_roles

# Create superuser (optional)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### Test Django Application

```bash
# Test with Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

If it works, stop it with `Ctrl+C`.

<<<<<<< HEAD
### 7. Create Gunicorn Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/ttms-backend.service
```

Add the following content:

```ini
[Unit]
Description=TTMS Backend Gunicorn Service
After=network.target

[Service]
User=ttms
Group=ttms
WorkingDirectory=/home/ttms/team-task-management-system/backend
Environment="PATH=/home/ttms/team-task-management-system/backend/venv/bin"
ExecStart=/home/ttms/team-task-management-system/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/home/ttms/team-task-management-system/backend/ttms.sock \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ttms-backend
sudo systemctl start ttms-backend
sudo systemctl status ttms-backend
```

## Frontend Deployment

### 1. Install Node.js

```bash
# Install Node.js 18+ using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Build React Application

```bash
# Switch to ttms user
sudo su - ttms

# Navigate to frontend directory
cd /home/ttms/team-task-management-system
git checkout frontend
cd frontend

# Install dependencies
npm install

# Create .env file
nano .env
```

Add:
```env
REACT_APP_API_BASE_URL=https://your-domain.com/api
```

Or for IP address:
```env
REACT_APP_API_BASE_URL=http://your-server-ip/api
```

Build the application:

```bash
npm run build
```

This creates a `build` directory with production-ready files.

## Nginx Configuration

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ttms
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com your-server-ip;

    # Frontend
    location / {
        root /home/ttms/team-task-management-system/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        include proxy_params;
        proxy_pass http://unix:/home/ttms/team-task-management-system/backend/ttms.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static {
        alias /home/ttms/team-task-management-system/backend/staticfiles;
    }
}
```

### 2. Enable Site and Test

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ttms /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 3. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## SSL Certificate (Optional but Recommended)

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

Update Nginx configuration to use HTTPS (Certbot does this automatically).

## Maintenance Commands

### Backend Service

```bash
# Restart backend
sudo systemctl restart ttms-backend

# View logs
sudo journalctl -u ttms-backend -f

# Stop backend
sudo systemctl stop ttms-backend
```

### Nginx

```bash
# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Backup database
sudo -u postgres pg_dump ttms_db > backup.sql

# Restore database
sudo -u postgres psql ttms_db < backup.sql
```

## Updating the Application

### Backend Update

```bash
sudo su - ttms
cd /home/ttms/team-task-management-system
git pull origin backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart ttms-backend
```

### Frontend Update

```bash
sudo su - ttms
cd /home/ttms/team-task-management-system
git pull origin frontend
cd frontend
npm install
npm run build
sudo systemctl reload nginx
```

## Troubleshooting

### Backend not starting

```bash
# Check service status
sudo systemctl status ttms-backend

# Check logs
sudo journalctl -u ttms-backend -n 50

# Check socket permissions
ls -la /home/ttms/team-task-management-system/backend/ttms.sock
```

### Nginx 502 Bad Gateway

- Check if Gunicorn service is running
- Verify socket file exists and has correct permissions
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Database Connection Issues

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env` file
- Test connection: `psql -U ttms_user -d ttms_db -h localhost`

### Frontend not loading

- Verify build directory exists: `ls -la /home/ttms/team-task-management-system/frontend/build`
- Check Nginx configuration: `sudo nginx -t`
- Verify API base URL in frontend `.env` file

## Security Considerations

1. **Firewall**: Ensure only necessary ports are open
2. **SSL**: Use HTTPS in production
3. **Secrets**: Never commit `.env` files to version control
4. **Database**: Use strong passwords
5. **Updates**: Keep system packages updated
6. **Backups**: Set up regular database backups

## Backup Strategy

### Automated Backup Script

Create `/home/ttms/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/ttms/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump ttms_db > $BACKUP_DIR/ttms_db_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

Make it executable and add to crontab:

```bash
chmod +x /home/ttms/backup.sh
crontab -e
# Add: 0 2 * * * /home/ttms/backup.sh
```

<<<<<<< HEAD
## Demo Credentials

After deployment, you can create demo users using Django admin or the API:

1. Access Django admin: `https://your-domain.com/admin/`
2. Or use the registration endpoint to create users
3. Assign roles using the Users page (Admin only) or Django admin

## Support

For issues or questions, refer to the main README.md or contact the development team.

=======
## Post-Deployment Checklist

- [ ] Backend accessible via HTTPS
- [ ] Frontend accessible via HTTPS
- [ ] Database migrations run
- [ ] Roles initialized
- [ ] Superuser created
- [ ] CORS configured correctly
- [ ] Frontend connects to backend
- [ ] All features tested
- [ ] API documentation accessible at /api/docs/
>>>>>>> 24df254 (docs: add deployment guide and demo credentials for DigitalOcean VPS)
