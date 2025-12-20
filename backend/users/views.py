from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from .models import User
from .permissions import CanManageUsers
from .serializers import UserProfileSerializer, UserSerializer


def log_user_action(admin_user, action, description, target_user, request):
    """Helper to log user-related admin actions"""
    from auth_app.models import AdminActivityLog
    from auth_app.views import log_admin_action
    
    log_admin_action(
        admin_user=admin_user,
        action=action,
        description=description,
        target_user=target_user,
        metadata={
            'target_user_email': target_user.email,
            'target_user_role': target_user.role
        },
        request=request
    )


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User management"""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanManageUsers]

    def get_permissions(self):
        # Allow managers to list/retrieve users (to assign tasks); keep mutations admin-only
        if self.action in ["list", "retrieve", "profile", "update_profile"]:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, CanManageUsers]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all()
        # Managers can only see members (their team) and themselves
        if user.is_manager:
            queryset = queryset.filter(role__in=[User.Role.MANAGER, User.Role.MEMBER])
        elif not user.is_admin:
            queryset = queryset.filter(id=user.id)
        # Filter by role if provided
        role = self.request.query_params.get("role", None)
        if role:
            queryset = queryset.filter(role=role)
        # Search by email or username
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(email__icontains=search) | queryset.filter(
                username__icontains=search
            )
        return queryset

    def perform_create(self, serializer):
        """Log user creation"""
        user = serializer.save()
        from auth_app.models import AdminActivityLog
        log_user_action(
            admin_user=self.request.user,
            action=AdminActivityLog.Action.CREATE_USER,
            description=f"Created user: {user.email} with role {user.get_role_display()}",
            target_user=user,
            request=self.request
        )

    def perform_update(self, serializer):
        """Log user updates"""
        user = serializer.save()
        from auth_app.models import AdminActivityLog
        log_user_action(
            admin_user=self.request.user,
            action=AdminActivityLog.Action.UPDATE_USER,
            description=f"Updated user: {user.email}",
            target_user=user,
            request=self.request
        )

    def perform_destroy(self, instance):
        """Log user deletion"""
        from auth_app.models import AdminActivityLog
        email = instance.email
        log_user_action(
            admin_user=self.request.user,
            action=AdminActivityLog.Action.DELETE_USER,
            description=f"Deleted user: {email}",
            target_user=instance,
            request=self.request
        )
        instance.delete()

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get current user's profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @action(
        detail=False, methods=["put", "patch"], permission_classes=[IsAuthenticated]
    )
    def update_profile(self, request):
        """Update current user's profile"""
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, CanManageUsers],
    )
    def change_role(self, request, pk=None):
        """Change user's role (Admin only)"""
        user = self.get_object()
        role_value = request.data.get("role")

        if not role_value:
            return Response(
                {"error": "role is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        valid_roles = {choice for choice, _ in User.Role.choices}
        if role_value not in valid_roles:
            return Response(
                {"error": "Invalid role value"}, status=status.HTTP_400_BAD_REQUEST
            )

        old_role = user.role
        user.role = role_value
        user.save()
        
        # Log role change
        from auth_app.models import AdminActivityLog
        log_user_action(
            admin_user=request.user,
            action=AdminActivityLog.Action.CHANGE_ROLE,
            description=f"Changed role for {user.email} from {User.Role(old_role).label} to {user.get_role_display()}",
            target_user=user,
            request=request
        )
        
        return Response(
            {
                "message": f"User role changed to {user.get_role_display()}",
                "user": UserSerializer(user).data,
            }
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, CanManageUsers],
    )
    def reset_password(self, request, pk=None):
        """Reset user's password (Admin only)"""
        user = self.get_object()
        new_password = request.data.get("new_password")

        if not new_password:
            return Response(
                {"error": "new_password is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            user.set_password(new_password)
            user.save()
            
            # Log password reset
            from auth_app.models import AdminActivityLog
            log_user_action(
                admin_user=request.user,
                action=AdminActivityLog.Action.RESET_PASSWORD,
                description=f"Reset password for {user.email}",
                target_user=user,
                request=request
            )

        return Response({
            "message": f"Password reset successfully for {user.email}"
        }, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, CanManageUsers],
    )
    def activate(self, request, pk=None):
        """Activate user account (Admin only)"""
        user = self.get_object()
        
        if user.is_active:
            return Response(
                {"message": "User is already active"},
                status=status.HTTP_200_OK
            )

        user.is_active = True
        user.save()
        
        # Log activation
        from auth_app.models import AdminActivityLog
        log_user_action(
            admin_user=request.user,
            action=AdminActivityLog.Action.ACTIVATE_USER,
            description=f"Activated user: {user.email}",
            target_user=user,
            request=request
        )

        return Response({
            "message": f"User {user.email} activated successfully",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, CanManageUsers],
    )
    def deactivate(self, request, pk=None):
        """Deactivate user account (Admin only)"""
        user = self.get_object()
        
        # Prevent admin from deactivating themselves
        if user.id == request.user.id:
            return Response(
                {"error": "You cannot deactivate your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.is_active:
            return Response(
                {"message": "User is already inactive"},
                status=status.HTTP_200_OK
            )

        user.is_active = False
        user.save()
        
        # Log deactivation
        from auth_app.models import AdminActivityLog
        log_user_action(
            admin_user=request.user,
            action=AdminActivityLog.Action.DEACTIVATE_USER,
            description=f"Deactivated user: {user.email}",
            target_user=user,
            request=request
        )

        return Response({
            "message": f"User {user.email} deactivated successfully",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

