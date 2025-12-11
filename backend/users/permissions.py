from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """Permission check for Admin role"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_admin
        )


class IsManager(permissions.BasePermission):
    """Permission check for Manager role"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin or request.user.is_manager)
        )


class IsAdminOrManager(permissions.BasePermission):
    """Permission check for Admin or Manager roles"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin or request.user.is_manager)
        )


class CanManageUsers(permissions.BasePermission):
    """Permission check for user management (Admin only)"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.can_manage_users()
        )


class CanManageTasks(permissions.BasePermission):
    """Permission check for task management (Admin or Manager)"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.can_manage_tasks()
        )


class CanAssignTasks(permissions.BasePermission):
    """Permission check for task assignment (Admin or Manager)"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.can_assign_tasks()
        )


class CanEditTask(permissions.BasePermission):
    """Permission check for editing specific task"""
    
    def has_object_permission(self, request, view, obj):
        # Admin can edit any task
        if request.user.is_admin:
            return True
        # Manager can edit any task
        if request.user.is_manager:
            return True
        # Member can only edit assigned tasks
        if request.user.is_member:
            return obj.assignee == request.user
        return False


class CanDeleteTask(permissions.BasePermission):
    """Permission check for deleting specific task"""
    
    def has_object_permission(self, request, view, obj):
        # Only Admin and Manager can delete tasks
        return request.user.is_admin or request.user.is_manager

