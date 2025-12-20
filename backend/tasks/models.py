import uuid

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
    
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    
    PRIORITY_CHOICES = [
        (LOW, 'Low'),
        (MEDIUM, 'Medium'),
        (HIGH, 'High'),
    ]
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default=MEDIUM
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


class Notification(models.Model):
    """Simple notification for task events"""

    TASK_ASSIGNED = "TASK_ASSIGNED"
    TASK_STARTED = "TASK_STARTED"
    TASK_DONE = "TASK_DONE"
    TASK_REMINDER = "TASK_REMINDER"
    TASK_COMMENTED = "TASK_COMMENTED"

    NOTIFICATION_TYPES = [
        (TASK_ASSIGNED, "Task assigned"),
        (TASK_STARTED, "Task started"),
        (TASK_DONE, "Task completed"),
        (TASK_REMINDER, "Task reminder"),
        (TASK_COMMENTED, "Task commented"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_type_display()}: {self.message}"


class Comment(models.Model):
    """Task comments"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="task_comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author} on {self.task}"


class Project(models.Model):
    """Project model grouping tasks and members"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects'
    )
    members = models.ManyToManyField(User, related_name='projects', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ActivityLog(models.Model):
    """Activity log for auditing actions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=200)
    model = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    detail = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.created_at.isoformat()} - {self.user} - {self.action}"
