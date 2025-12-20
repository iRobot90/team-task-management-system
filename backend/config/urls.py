"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from auth_app.views import (
    RegisterView, login_view, logout_view,
    request_password_reset, check_reset_status, confirm_password_reset,
    PasswordResetRequestViewSet, AdminActivityLogViewSet,
    system_status, user_activity_stats
)
from users.views import UserViewSet
from tasks.views import TaskViewSet, NotificationViewSet, ProjectViewSet, ActivityLogViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'activity', ActivityLogViewSet, basename='activity')
# Admin-specific viewsets
router.register(r'admin/password-resets', PasswordResetRequestViewSet, basename='password-reset')
router.register(r'admin/logs', AdminActivityLogViewSet, basename='admin-log')

urlpatterns = [
    path('admin/', admin.site.urls),
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # Authentication Endpoints
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Password Reset Endpoints
    path('api/auth/password-reset/request/', request_password_reset, name='password-reset-request'),
    path('api/auth/password-reset/status/<uuid:request_id>/', check_reset_status, name='password-reset-status'),
    path('api/auth/password-reset/confirm/', confirm_password_reset, name='password-reset-confirm'),
    # Admin Monitoring Endpoints
    path('api/admin/system-status/', system_status, name='system-status'),
    path('api/admin/user-activity-stats/', user_activity_stats, name='user-activity-stats'),
    # Router URLs
    path('api/', include(router.urls)),
]
