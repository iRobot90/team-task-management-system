"""
System monitoring utilities for admin dashboard
"""
import os
import platform
import psutil
from django.db import connection
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from tasks.models import Task, Project
from .models import AdminActivityLog, PasswordResetRequest

User = get_user_model()


def get_system_status():
    """Get overall system health and statistics"""
    
    # CPU and Memory
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Database stats
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    total_tasks = Task.objects.count()
    total_projects = Project.objects.count()
    
    # Activity in last 24 hours
    last_24h = timezone.now() - timedelta(hours=24)
    recent_logins = AdminActivityLog.objects.filter(
        action=AdminActivityLog.Action.LOGIN,
        created_at__gte=last_24h
    ).count()
    
    recent_activities = AdminActivityLog.objects.filter(
        created_at__gte=last_24h
    ).count()
    
    pending_password_resets = PasswordResetRequest.objects.filter(
        status=PasswordResetRequest.Status.PENDING
    ).count()
    
    # Calculate database size
    db_size = get_database_size()
    
    return {
        'timestamp': timezone.now(),
        'system': {
            'platform': platform.system(),
            'platform_version': platform.version(),
            'python_version': platform.python_version(),
            'cpu_percent': cpu_percent,
            'cpu_count': psutil.cpu_count(),
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'percent': memory.percent,
                'used': memory.used,
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent,
            },
        },
        'database': {
            'size': db_size,
            'connection': connection.vendor,
        },
        'statistics': {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'total_tasks': total_tasks,
            'total_projects': total_projects,
            'pending_password_resets': pending_password_resets,
        },
        'activity': {
            'recent_logins_24h': recent_logins,
            'recent_activities_24h': recent_activities,
        }
    }


def get_database_size():
    """Get database size in bytes"""
    if connection.vendor == 'sqlite':
        # For SQLite, get the file size
        db_path = connection.settings_dict['NAME']
        if os.path.exists(db_path):
            return os.path.getsize(db_path)
        return 0
    elif connection.vendor == 'postgresql':
        # For PostgreSQL
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pg_database_size(%s)",
                [connection.settings_dict['NAME']]
            )
            return cursor.fetchone()[0]
    return 0


def get_user_activity_stats(days=7):
    """Get user activity statistics for the last N days"""
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    # Group activities by action type
    activity_by_type = {}
    for action_choice in AdminActivityLog.Action.choices:
        action_code = action_choice[0]
        count = AdminActivityLog.objects.filter(
            action=action_code,
            created_at__gte=start_date
        ).count()
        activity_by_type[action_code] = {
            'label': action_choice[1],
            'count': count
        }
    
    # Get most active admins
    from django.db.models import Count
    most_active_admins = AdminActivityLog.objects.filter(
        created_at__gte=start_date,
        admin_user__isnull=False
    ).values(
        'admin_user__email',
        'admin_user__username'
    ).annotate(
        activity_count=Count('id')
    ).order_by('-activity_count')[:5]
    
    # Get recent critical actions
    recent_critical = AdminActivityLog.objects.filter(
        created_at__gte=start_date,
        action__in=[
            AdminActivityLog.Action.DELETE_USER,
            AdminActivityLog.Action.DEACTIVATE_USER,
            AdminActivityLog.Action.REJECT_RESET,
        ]
    ).order_by('-created_at')[:10]
    
    return {
        'period_days': days,
        'start_date': start_date,
        'end_date': end_date,
        'activity_by_type': activity_by_type,
        'most_active_admins': list(most_active_admins),
        'recent_critical_actions': [
            {
                'id': str(log.id),
                'admin': log.admin_user.email if log.admin_user else 'System',
                'action': log.get_action_display(),
                'description': log.description,
                'timestamp': log.created_at,
            }
            for log in recent_critical
        ]
    }


def get_user_role_distribution():
    """Get distribution of users by role"""
    from django.db.models import Count
    
    role_distribution = User.objects.values('role').annotate(
        count=Count('id')
    ).order_by('role')
    
    return {
        role['role']: {
            'count': role['count'],
            'label': User.Role(role['role']).label
        }
        for role in role_distribution
    }
