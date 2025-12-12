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
- **Permissions:** Can create/edit/delete tasks, assign tasks to team members, view team performance analytics

### Member Account
- **Email:** member@ttms.com
- **Password:** member123
- **Role:** Member
- **Permissions:** Can view and update only tasks assigned to them, view personal performance metrics

## Key Features by Role

### Admin Features
- View all users in Users page
- Create, edit, delete users
- Assign roles to users
- View and manage all tasks
- Access all performance analytics

### Manager Features
- **Task Management:**
  - Create, edit, delete tasks
  - Assign tasks to team members
  - Filter tasks by status, assignee, search, and date range
  - View "My Team Tasks" page with full CRUD operations
- **Performance Analytics:**
  - View "Team Performance" page
  - Top performers leaderboard
  - Completion rates per member
  - Productivity trends
  - Tasks per member
  - Overdue tasks tracking

### Member Features
- **Task Management:**
  - View "My Tasks" page with responsive card layout
  - Update task status (To Do, In Progress, Done)
  - Filter tasks by status and search
  - View task details and progress
- **Performance Analytics:**
  - View "My Performance" page
  - Personal completion rate
  - Task status distribution
  - Overdue tasks tracking
  - Weekly progress trends

## Navigation Structure

### SideNav Items (Role-Based)
**For Managers:**
- Dashboard
- Tasks (My Team Tasks)
- Team Performance
- Profile

**For Members:**
- Dashboard
- Tasks (My Tasks)
- My Performance
- Profile

**For Admins:**
- Dashboard
- Tasks
- Team Performance
- Users
- Profile

## Layout Features

### Responsive Design
- **Desktop:** 3-column task grid layout
- **Tablet:** 2-column task grid layout
- **Mobile:** 1-column task grid layout
- Smooth hamburger menu animations
- Click outside to close mobile menu

### UI Improvements
- Modern card-based task display
- Consistent spacing and design system
- Fixed TopNav with "Welcome {username}" header
- No placeholder text like "member@ttms.com Logout"
- Clean, professional interface

## How to Use

1. **Login** with any of the above credentials
2. **Manager Workflow:**
   - Navigate to "Tasks" to manage team tasks
   - Create new tasks and assign to members
   - Monitor progress via "Team Performance"
   - Filter and search tasks as needed
3. **Member Workflow:**
   - View assigned tasks in "My Tasks"
   - Update task status as work progresses
   - Track personal metrics in "My Performance"
   - Filter tasks by status and search

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
- New users register with "Member" role by default
- Only Admin can change user roles
- Tasks display as responsive cards, not plain lists
- Managers are excluded from member performance analytics
- System supports real-time updates via WebSocket
- All pages follow consistent design system with proper spacing

