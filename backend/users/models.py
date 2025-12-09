from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    """Role model for RBAC"""
    ADMIN = 'admin'
    MANAGER = 'manager'
    MEMBER = 'member'
    
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (MANAGER, 'Manager'),
        (MEMBER, 'Member'),
    ]
    
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'roles'
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()


class User(AbstractUser):
    """Custom User model with role-based access control"""
    email = models.EmailField(unique=True)
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def is_admin(self):
        """Check if user is admin"""
        return self.role and self.role.name == Role.ADMIN
    
    @property
    def is_manager(self):
        """Check if user is manager"""
        return self.role and self.role.name == Role.MANAGER
    
    @property
    def is_member(self):
        """Check if user is member"""
        return self.role and self.role.name == Role.MEMBER
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.is_admin
    
    def can_manage_tasks(self):
        """Check if user can create/edit/delete tasks"""
        return self.is_admin or self.is_manager
    
    def can_assign_tasks(self):
        """Check if user can assign tasks to others"""
        return self.is_admin or self.is_manager
