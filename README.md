# Team Task Management System (TTMS)

A full-stack Task Management Web Application for small teams built with React and Django REST Framework.

## Features

- **Role-Based Access Control (RBAC)**: Admin, Manager, and Member roles with granular permissions
- **JWT Authentication**: Secure token-based authentication
- **Task Management**: Create, update, delete, and assign tasks with status tracking
- **User Management**: Admin can manage users and assign roles
- **Dashboard**: View task statistics and manage your workflow

## Tech Stack

### Backend
- Django 5.1.2
- Django REST Framework 3.15.2
- JWT Authentication (djangorestframework-simplejwt)
- PostgreSQL
- Gunicorn (for production)

### Frontend
- React 18+
- React Router
- Modern UI with clean design

## Prerequisites

- Python 3.13+
- Node.js 24+
- PostgreSQL 12+
- npm or yarn

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and settings.

5. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE ttms_db;
   ```

6. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

7. **Initialize default roles:**
   ```bash
   python manage.py init_roles
   ```

8. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

9. **Run development server:**
   ```bash
   python manage.py runserver
   ```

Backend will be available at `http://localhost:8000`

## Frontend Setup

(Coming soon - React frontend will be set up next)

## Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=ttms_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh JWT token

### Users (Admin only)
- `GET /api/users/` - List all users
- `GET /api/users/{id}/` - Get user details
- `POST /api/users/` - Create user
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user
- `GET /api/users/profile/` - Get current user profile
- `PUT /api/users/update_profile/` - Update current user profile

### Tasks
- `GET /api/tasks/` - List tasks (filtered by role)
- `GET /api/tasks/{id}/` - Get task details
- `POST /api/tasks/` - Create task (Manager/Admin)
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task (Manager/Admin)
- `GET /api/tasks/my_tasks/` - Get current user's tasks
- `GET /api/tasks/statistics/` - Get task statistics

### Roles
- `GET /api/roles/` - List all roles

## Deployment

### Backend Deployment (DigitalOcean VPS)

1. **Install dependencies on server:**
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv postgresql nginx
   ```

2. **Set up PostgreSQL:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE ttms_db;
   CREATE USER ttms_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ttms_db TO ttms_user;
   ```

3. **Configure Gunicorn:**
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000
   ```

4. **Set up Nginx reverse proxy** (see deployment docs)

5. **Configure environment variables** on server

## License

This project is licensed under the MIT License.

## Roles & Permissions

- **Admin**: Full system access, can manage users, roles, and all tasks
- **Manager**: Can create/edit/delete tasks and assign to team members
- **Member**: Can view and update only tasks assigned to them

## Demo Credentials

- Admin: `admin@ttms.com` / `admin123`
- Manager: `manager@ttms.com` / `manager123`
- Member: `member@ttms.com` / `member123`

## Notifications

- Assignment: assignee is notified on task assign/unassign.
- Status changes: creator is notified when a task is started or done.
- Comments: assignee and creator are notified on new comments.
- UI: bell icon in the top nav (unread badge), dashboard notifications list, and profile notifications list.

## Development Status

- Backend scaffolding with Django + DRF
- JWT Authentication
- RBAC system (Admin, Manager, Member)
- Task and User models with full CRUD
- Complete API endpoints
- React frontend with all pages
- Task CRUD operations (Create, Update, Delete, Assign)
- User management (Admin only)
- Task filtering by status and assignee
- Deployment documentation
- Architecture documentation

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
python manage.py migrate
python manage.py init_roles
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API base URL
npm start
```

## Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions for DigitalOcean VPS
- [Architecture Decisions](ARCHITECTURE.md) - Detailed architecture and design decisions

## Features Implemented

### Authentication & Authorization
- User registration and login with JWT
- Role-Based Access Control (RBAC)
- Three roles: Admin, Manager, Member
- Protected routes and API endpoints

### Task Management
- Create, read, update, delete tasks
- Task assignment to users
- Filter by status (Todo, In Progress, Done)
- Filter by assignee
- Deadline tracking
- Status updates

### User Management (Admin Only)
- Create, update, delete users
- Role assignment
- User activation/deactivation
- Profile management

### Dashboard
- Task statistics
- Role-based views
- Quick overview of tasks

## API Documentation

All API endpoints are RESTful and follow standard conventions. See the codebase for detailed endpoint documentation.

Base URL: `http://localhost:8000/api`

Key endpoints:
- `/api/auth/register/` - User registration
- `/api/auth/login/` - User login
- `/api/tasks/` - Task CRUD operations
- `/api/users/` - User management (Admin only)
- `/api/roles/` - List available roles
