import uuid

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from .mixins import RoleFlagsMixin


class User(RoleFlagsMixin, AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        MANAGER = "MANAGER", "Manager"
        MEMBER = "MEMBER", "Member"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=10, choices=Role.choices, default=Role.MEMBER
    )
    profile_image = models.ImageField(
        upload_to="users/profile_images/", blank=True, null=True
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    middle_name = models.CharField(max_length=150, blank=True, null=True)
    groups = models.ManyToManyField(
        Group,
        related_name="custom_user_set",
        blank=True,
        help_text="The groups this user belongs to.",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="custom_user_set",
        blank=True,
        help_text="Specific permissions for this user.",
        related_query_name="user",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.username} ({self.role})"

class User(RoleFlagsMixin, AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MANAGER = "MANAGER", "Manager"
        MEMBER = "MEMBER", "Member"

class AdminProfile(models.Model):
    """Profile for users with administrative privileges."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="admin_profile"
    )
    department = models.CharField(max_length=255, blank=True, null=True)
    permissions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Administrator"

    class Meta:
        verbose_name = "Administrator Profile"
        verbose_name_plural = "Administrator Profiles"


class ManagerProfile(models.Model):
    """Profile for users with management responsibilities."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="manager_profile"
    )
    team = models.CharField(max_length=255, blank=True, null=True)
    can_approve = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Manager"

    class Meta:
        verbose_name = "Manager Profile"
        verbose_name_plural = "Manager Profiles"


class MemberProfile(models.Model):
    """Profile for regular team members."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="member_profile"
    )
    position = models.CharField(max_length=255, blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Team Member"

    class Meta:
        verbose_name = "Team Member Profile"
        verbose_name_plural = "Team Member Profiles"
