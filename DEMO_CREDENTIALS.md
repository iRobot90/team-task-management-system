# Demo Credentials - Team Task Management System

## Application URLs

**Frontend:** [Will be updated after deployment]
**Backend API:** [Will be updated after deployment]
**API Documentation:** [Will be updated after deployment]/api/docs/

## Test Accounts

### Admin Account
- **Email:** admin@ttms.com
- **Password:** admin123
- **Role:** Admin
- **Permissions:** Full system access, can manage users and all tasks

### Manager Account
- **Email:** manager@ttms.com
- **Password:** manager123
- **Role:** Manager
- **Permissions:** Can create/edit/delete tasks, assign to team members

### Member Account
- **Email:** member@ttms.com
- **Password:** member123
- **Role:** Member
- **Permissions:** Can view and update only tasks assigned to them

## How to Use

1. **Login** with any of the above credentials
2. **Admin** can:
   - View all users in Users page
   - Create, edit, delete users
   - Assign roles to users
   - View and manage all tasks
3. **Manager** can:
   - Create, edit, delete tasks
   - Assign tasks to team members
   - View all tasks
4. **Member** can:
   - View only tasks assigned to them
   - Update status of assigned tasks
   - View dashboard with personal statistics

## API Testing

Use the Swagger UI at `/api/docs/` to test API endpoints directly.

**Authentication:**
1. POST /api/auth/login/ with email and password
2. Copy the access token from response
3. Click "Authorize" in Swagger UI
4. Enter: `Bearer <your-access-token>`
5. Test endpoints

## Notes

- All passwords can be changed after login
- New users can register, default role is Member
- Only Admin can change user roles
- Tasks can be filtered by status and assignee

