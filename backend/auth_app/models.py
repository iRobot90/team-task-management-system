import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class PasswordResetRequest(models.Model):
    """Model for password reset requests requiring admin approval"""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Admin Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        COMPLETED = 'COMPLETED', 'Password Reset Completed'
        EXPIRED = 'EXPIRED', 'Expired'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_requests'
    )
    token = models.CharField(max_length=100, unique=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_password_resets'
    )
    reason = models.TextField(blank=True, null=True, help_text="Optional reason for request")
    admin_notes = models.TextField(blank=True, null=True, help_text="Admin notes for approval/rejection")
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'password_reset_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Token expires in 24 hours after approval
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """Check if the reset token has expired"""
        return timezone.now() > self.expires_at
    
    def can_reset_password(self):
        """Check if password can be reset with this request"""
        return (
            self.status == self.Status.APPROVED and
            not self.is_expired()
        )
    
    def __str__(self):
        return f"Password Reset - {self.user.email} ({self.status})"


class AdminActivityLog(models.Model):
    """Model to track all admin activities for audit purposes"""
    
    class Action(models.TextChoices):
        CREATE_USER = 'CREATE_USER', 'Created User'
        UPDATE_USER = 'UPDATE_USER', 'Updated User'
        DELETE_USER = 'DELETE_USER', 'Deleted User'
        CHANGE_ROLE = 'CHANGE_ROLE', 'Changed User Role'
        RESET_PASSWORD = 'RESET_PASSWORD', 'Reset User Password'
        APPROVE_RESET = 'APPROVE_RESET', 'Approved Password Reset'
        REJECT_RESET = 'REJECT_RESET', 'Rejected Password Reset'
        ACTIVATE_USER = 'ACTIVATE_USER', 'Activated User'
        DEACTIVATE_USER = 'DEACTIVATE_USER', 'Deactivated User'
        CREATE_TASK = 'CREATE_TASK', 'Created Task'
        UPDATE_TASK = 'UPDATE_TASK', 'Updated Task'
        DELETE_TASK = 'DELETE_TASK', 'Deleted Task'
        LOGIN = 'LOGIN', 'Admin Login'
        LOGOUT = 'LOGOUT', 'Admin Logout'
        OTHER = 'OTHER', 'Other Action'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_actions'
    )
    action = models.CharField(max_length=50, choices=Action.choices)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actions_received',
        help_text="User affected by this action"
    )
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional data about the action")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_activity_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin_user', '-created_at']),
            models.Index(fields=['action']),
            models.Index(fields=['target_user']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        admin_name = self.admin_user.email if self.admin_user else "System"
        return f"{admin_name} - {self.get_action_display()} at {self.created_at}"
