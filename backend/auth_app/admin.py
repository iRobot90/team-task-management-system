from django.contrib import admin
from .models import PasswordResetRequest, AdminActivityLog


@admin.register(PasswordResetRequest)
class PasswordResetRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'created_at', 'approved_by', 'approved_at']
    list_filter = ['status', 'created_at', 'approved_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['id', 'token', 'created_at', 'approved_at', 'completed_at']
    ordering = ['-created_at']


@admin.register(AdminActivityLog)
class AdminActivityLogAdmin(admin.ModelAdmin):
    list_display = ['admin_user', 'action', 'target_user', 'created_at', 'ip_address']
    list_filter = ['action', 'created_at']
    search_fields = ['admin_user__email', 'target_user__email', 'description']
    readonly_fields = ['id', 'admin_user', 'action', 'target_user', 'description', 'metadata', 'ip_address', 'user_agent', 'created_at']
    ordering = ['-created_at']

