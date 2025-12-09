from django.db import models
from django.core.validators import MinLengthValidator
from users.models import User


class Task(models.Model):
    """Task model for task management"""
    TODO = 'todo'
    IN_PROGRESS = 'in_progress'
    DONE = 'done'
    
    STATUS_CHOICES = [
        (TODO, 'Todo'),
        (IN_PROGRESS, 'In Progress'),
        (DONE, 'Done'),
    ]
    
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)]
    )
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=TODO
    )
    deadline = models.DateTimeField(null=True, blank=True)
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['assignee']),
            models.Index(fields=['created_by']),
            models.Index(fields=['deadline']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    def can_be_edited_by(self, user):
        """Check if user can edit this task"""
        if user.is_admin:
            return True
        if user.is_manager:
            return True
        if user.is_member:
            return self.assignee == user
        return False
    
    def can_be_deleted_by(self, user):
        """Check if user can delete this task"""
        if user.is_admin:
            return True
        if user.is_manager:
            return True
        return False
