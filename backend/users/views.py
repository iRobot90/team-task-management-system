from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User
from .permissions import CanManageUsers
from .serializers import UserProfileSerializer, UserSerializer


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

        user.role = role_value
        user.save()
        return Response(
            {
                "message": f"User role changed to {user.get_role_display()}",
                "user": UserSerializer(user).data,
            }
        )
