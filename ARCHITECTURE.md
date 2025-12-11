# Architecture Decisions - Team Task Management System

This document explains the architectural decisions and design patterns used in the TTMS project.

## Overview

TTMS is a full-stack web application built with Django REST Framework (backend) and React (frontend), implementing a role-based access control system for task management.

## Technology Stack

### Backend
- **Django 5.1.2**: Modern Python web framework
- **Django REST Framework 3.15.2**: RESTful API framework
- **djangorestframework-simplejwt 5.3.1**: JWT authentication
- **PostgreSQL**: Relational database (production-ready, better than SQLite)
- **Gunicorn**: WSGI HTTP server for production
- **psycopg2-binary**: PostgreSQL adapter

### Frontend
- **React 18+**: Modern UI library with hooks
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **CSS**: Custom styling (no external UI libraries for simplicity)

## Architecture Patterns

### 1. Modular Backend Structure

The backend follows Django's app-based architecture:

```
backend/
├── config/          # Project settings and configuration
├── users/           # User and role management
├── tasks/           # Task management
└── auth_app/        # Authentication endpoints
```

**Rationale**: Separation of concerns allows for:
- Easy maintenance and testing
- Clear responsibility boundaries
- Scalability for future features

### 2. RESTful API Design

All endpoints follow REST conventions:
- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{id}/` - Get task details
- `PUT/PATCH /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task

**Rationale**: 
- Standard HTTP methods for predictable behavior
- Easy to understand and document
- Works well with frontend frameworks

### 3. Role-Based Access Control (RBAC)

Three-tier role system:
- **Admin**: Full system access
- **Manager**: Task management and assignment
- **Member**: View and update assigned tasks only

**Implementation**:
- Custom User model with ForeignKey to Role
- Custom permission classes in `users/permissions.py`
- Permission checks at view level

**Rationale**:
- Flexible permission system
- Easy to extend with new roles
- Clear separation of access levels

### 4. JWT Authentication

Using JWT tokens instead of session-based auth:

**Advantages**:
- Stateless authentication (scales better)
- Works well with SPAs (Single Page Applications)
- No server-side session storage needed

**Token Storage**: localStorage (can be upgraded to httpOnly cookies for better security)

**Token Refresh**: Automatic token refresh on 401 errors using axios interceptors

### 5. Database Design

**PostgreSQL over SQLite**:
- Production-ready
- Better concurrency handling
- ACID compliance
- Better for multi-user applications

**Relationships**:
- User → Role (Many-to-One)
- Task → User (assignee, Many-to-One)
- Task → User (created_by, Many-to-One)

**Indexes**: Added on frequently queried fields (status, assignee, deadline)

### 6. Frontend Architecture

**Component Structure**:
```
src/
├── api/           # API service layer
├── components/    # Reusable UI components
├── context/       # React Context (Auth)
├── hooks/         # Custom React hooks (future)
├── pages/         # Page components
└── utils/         # Utility functions
```

**Rationale**:
- Clear separation of concerns
- Reusable components
- Centralized API calls
- Easy to test and maintain

### 7. State Management

**React Context for Authentication**:
- Global auth state
- No need for Redux (simple app)
- Easy to access user data anywhere

**Local State for Pages**:
- Each page manages its own data
- Fetches on mount
- Updates after mutations

**Rationale**: 
- Simple state needs don't require complex state management
- Context API sufficient for auth
- Local state keeps components independent

### 8. Error Handling

**Backend**:
- Consistent JSON error responses
- HTTP status codes properly used
- Validation errors returned in structured format

**Frontend**:
- Try-catch blocks in API calls
- Error messages displayed to users
- Loading states during async operations

### 9. Security Considerations

**Backend**:
- JWT token authentication
- CORS configured for specific origins
- Environment variables for secrets
- Password validation
- SQL injection protection (Django ORM)

**Frontend**:
- Token stored in localStorage
- Axios interceptors for automatic token refresh
- Protected routes with PrivateRoute component
- Role-based UI rendering

**Future Improvements**:
- httpOnly cookies for token storage
- CSRF protection for state-changing operations
- Rate limiting on API endpoints
- Input sanitization

### 10. Deployment Architecture

**Production Stack**:
- **Nginx**: Reverse proxy and static file server
- **Gunicorn**: WSGI server for Django
- **PostgreSQL**: Database server
- **Systemd**: Service management

**Rationale**:
- Nginx handles static files efficiently
- Gunicorn is production-ready WSGI server
- Systemd ensures service reliability
- All components are industry-standard

## Design Decisions

### 1. Why Functional Components?

React functional components with hooks:
- Modern React best practice
- Easier to test
- Better performance
- Cleaner code

### 2. Why No UI Framework?

Custom CSS instead of Material-UI or Bootstrap:
- No external dependencies
- Full control over styling
- Smaller bundle size
- Simpler for this project scope

### 3. Why Separate Branches?

Frontend and backend in separate branches:
- Independent development
- Clear separation of concerns
- Easier to deploy separately
- Better for team collaboration

### 4. Why PostgreSQL?

PostgreSQL over MySQL or MongoDB:
- Open source and reliable
- Excellent Django support
- ACID compliance
- Good performance
- Rich feature set

### 5. Why Gunicorn?

Gunicorn over Uvicorn:
- Mature and stable
- Good for Django applications
- Easy to configure
- Well-documented

## Scalability Considerations

### Current Architecture
- Suitable for small to medium teams (10-100 users)
- Single server deployment
- Monolithic backend

### Future Scalability Options

1. **Horizontal Scaling**:
   - Multiple Gunicorn workers
   - Load balancer (Nginx or HAProxy)
   - Database replication

2. **Caching**:
   - Redis for session storage
   - Memcached for query caching
   - CDN for static assets

3. **Microservices** (if needed):
   - Separate auth service
   - Task service
   - User service

4. **Database Optimization**:
   - Connection pooling
   - Read replicas
   - Query optimization

## Testing Strategy

### Current State
- Basic error handling
- Manual testing during development

### Recommended Additions
- Unit tests for models and serializers
- Integration tests for API endpoints
- Frontend component tests
- E2E tests for critical flows

## Code Quality

### Backend
- PEP 8 style guide
- Docstrings for functions
- Type hints (can be added)
- Modular structure

### Frontend
- ESLint configuration
- Consistent naming conventions
- Component-based architecture
- Reusable utilities

## API Design Principles

1. **Consistency**: All endpoints follow same patterns
2. **Pagination**: Large lists are paginated
3. **Filtering**: Query parameters for filtering
4. **Error Handling**: Consistent error response format
5. **Documentation**: Clear endpoint documentation

## Security Best Practices Implemented

1. **Authentication**: JWT tokens
2. **Authorization**: RBAC with permission classes
3. **Input Validation**: Django serializers
4. **SQL Injection**: ORM protection
5. **CORS**: Configured for specific origins
6. **Secrets**: Environment variables

## Performance Optimizations

1. **Database**: Indexes on frequently queried fields
2. **Queries**: select_related for foreign keys
3. **Pagination**: Limit results per page
4. **Static Files**: Served by Nginx
5. **Frontend**: Production build optimization

## Conclusion

The architecture is designed to be:
- **Simple**: Easy to understand and maintain
- **Scalable**: Can grow with requirements
- **Secure**: Follows best practices
- **Maintainable**: Clear structure and patterns
- **Production-ready**: Suitable for deployment

This architecture balances simplicity with functionality, making it suitable for a team task management system while remaining extensible for future enhancements.

