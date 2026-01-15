# Team Task Management System (TTMS)

A full-stack Task Management Web Application for small teams built with **React** and **Django REST Framework**, featuring Role-Based Access Control (RBAC), JWT Authentication, and a modern UI.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

### Core Management
- **Role-Based Access Control (RBAC)**: 
  - **Admin**: Full system access, User Management, Activity Logs.
  - **Manager**: Task creation/assignment, Team Performance analytics.
  - **Member**: Personal task management (view/update assigned tasks).
- **Task Management**: Create, update, delete, and assign tasks with status tracking (Todo, In Progress, Done).
- **User Management**: Admin interface to create, edit, deactivate, and manage users.
- **Projects**: Organize tasks into projects.

### Security & Auth
- **JWT Authentication**: Secure stateless authentication with automatic token refresh.
- **Password Management**: Reset requesting with Admin approval workflow.
- **Secure Handling**: HTTPOnly cookies (optional config), granular permissions.

### Analytics & Dashboard
- **Admin Dashboard**: System health (CPU/RAM/Disk), user stats, activity logs (audit trail).
- **Team Performance**: Leaderboards, completion rates, productivity trends (Manager view).
- **Personal Metrics**: Individual task completion tracking (Member view).

### UI/UX
- **Modern Interface**: Custom CSS theme (Purple/Blue gradients), responsive design (Mobile/Tablet/Desktop).
- **Feedback**: Toast notifications, loading spinners, glassmorphism effects.
- **Password Visibility**: Toggle show/hide on inputs.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18+, React Router 6, Axios, Custom CSS (No heavy UI libs) |
| **Backend** | Django 5.1, Django REST Framework 3.15, SimpleJWT |
| **Database** | PostgreSQL (Production), SQLite (Dev) |
| **Utilities** | Gunicorn, Whitenoise, psutil |

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup Environment
cp .env.example .env
# Edit .env if using PostgreSQL, otherwise defaults to SQLite

# Initialize DB
python manage.py migrate
python manage.py init_roles
python manage.py createsuperuser

# Run Server
python manage.py runserver
```
Backend available at: `http://localhost:8000`

### 2. Frontend Setup
```bash
cd frontend
npm install

# Build & Run
npm start
```
Frontend available at: `http://localhost:3000`

## Cloud Deployment (Free Tier)

This project is configured for easy deployment on **Vercel** (Frontend) and **Render** (Backend).

### 1. Backend (Render)
1. Fork this repo.
2. New **Blueprint** on [Render](https://render.com).
3. Connect repo -> `Apply`.
4. Copy **Service URL** (e.g., `https://ttms-backend.onrender.com`).
   - *Note*: Includes `render.yaml` for auto-config of Python + Postgres.

### 2. Frontend (Vercel)
1. New Project on [Vercel](https://vercel.com).
2. Import repo -> Root Directory: `frontend`.
3. Env Var: `REACT_APP_API_BASE_URL` = `https://YOUR-RENDER-BACKEND.onrender.com/api`.
4. Deploy.

### 3. Final Config
1. On Render Dashboard -> Environment.
2. Add `CORS_ALLOWED_ORIGINS` = `https://your-frontend.vercel.app`.

## VPS Deployment (DigitalOcean/Ubuntu)

For full control, deploy on a VPS using Nginx + Gunicorn.

1. **System Config**:
   ```bash
   sudo apt update && sudo apt install -y python3-venv postgresql nginx git
   ```
2. **Database**:
   ```sql
   CREATE DATABASE ttms_db;
   CREATE USER ttms_user WITH PASSWORD 'strong_pass';
   GRANT ALL PRIVILEGES ON DATABASE ttms_db TO ttms_user;
   ```
3. **App Setup**:
   - Clone repo to `/var/www/ttms`.
   - Setup venv & install reqs.
   - Run `gunicorn` with systemd.
4. **Nginx**:
   - Proxy `/api` to Gunicorn (`localhost:8000` or socket).
   - Serve Frontend static build (`npm run build`) on root `/`.

## Testing

### Frontend (Jest/RTL)
```bash
cd frontend
npm test
# Coverage
npm test -- --coverage
```
Includes tests for: Auth flows, Dashboard rendering, Notification logic.

### Backend (Django Test)
```bash
cd backend
python manage.py test
```
Includes tests for: RBAC permissions, Models, API Endpoints.

## Demo & Default Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@ttms.com` | `admin123` | Full Access, User Mgmt |
| **Manager** | `manager@ttms.com` | `manager123` | Task Assign, Team Stats |
| **Member** | `member@ttms.com` | `member123` | My Tasks, My Stats |

*Note: New registered users are "Member" by default. Admin must upgrade them.*

## Architecture Highlights

- **Separation of Concerns**: Decoupled Frontend (React) and Backend (Django) allow independent scaling.
- **RESTful API**: Standardized endpoints for all resources.
- **Service Layer**: Frontend `api/` directory centralizes all HTTP calls.
- **Performance**:
  - `select_related` on backend queries.
  - Indexed DB fields (status, assignee).
  - React Memoization where appropriate.

## License
MIT License.
