from rest_framework import status, generics, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction
from users.models import User
from users.serializers import UserRegistrationSerializer, UserSerializer
from users.permissions import CanManageUsers
from .models import PasswordResetRequest, AdminActivityLog
from .serializers import (
    PasswordResetRequestSerializer,
    PasswordResetApprovalSerializer,
    PasswordResetConfirmSerializer,
    AdminActivityLogSerializer
)
import logging
import secrets

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_admin_action(admin_user, action, description, target_user=None, metadata=None, request=None):
    """Helper function to log admin activities"""
    log_data = {
        'admin_user': admin_user,
        'action': action,
        'description': description,
        'target_user': target_user,
        'metadata': metadata or {},
    }
    
    if request:
        log_data['ip_address'] = get_client_ip(request)
        log_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
    
    AdminActivityLog.objects.create(**log_data)
    logger.info(f"Admin action logged: {description}")


class RegisterView(generics.CreateAPIView):
    """User registration view"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        # Validate without raising so we can log validation errors for debugging
        if not serializer.is_valid():
            # Log validation errors to help diagnose 400 responses
            logger.debug('Registration validation errors: %s', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login view"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.check_password(password):
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'User account is disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        },
        'message': 'Login successful'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def logout_view(request):
    """User logout view (blacklist refresh token)"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )


# Password Reset Views

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request a password reset (requires admin approval)"""
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['user_email']
    
    try:
        user = User.objects.get(email=email)
        
        # Check for existing pending requests
        existing_pending = PasswordResetRequest.objects.filter(
            user=user,
            status=PasswordResetRequest.Status.PENDING
        ).first()
        
        if existing_pending:
            return Response({
                'message': 'A password reset request is already pending admin approval.',
                'request_id': str(existing_pending.id),
                'created_at': existing_pending.created_at
            }, status=status.HTTP_200_OK)
        
        # Create new password reset request
        reset_request = PasswordResetRequest.objects.create(
            user=user,
            token=secrets.token_urlsafe(32),
            reason=serializer.validated_data.get('reason', '')
        )

        # Notify Admins
        from tasks.models import Notification
        admins = User.objects.filter(role=User.Role.ADMIN)
        for admin in admins:
            Notification.objects.create(
                user=admin,
                type=Notification.SYSTEM_ALERT,
                message=f"New password reset request from {user.email}"
            )
        
        # Log the request
        log_admin_action(
            admin_user=None,
            action=AdminActivityLog.Action.OTHER,
            description=f"Password reset requested for {user.email}",
            target_user=user,
            metadata={'request_id': str(reset_request.id)},
            request=request
        )
        
        return Response({
            'message': 'Password reset request submitted. Awaiting admin approval.',
            'request_id': str(reset_request.id),
            'status': reset_request.status
        }, status=status.HTTP_201_CREATED)
        
    except User.DoesNotExist:
        # Return generic message for security
        return Response({
            'message': 'If the email exists, a password reset request has been submitted.'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_reset_status(request, request_id):
    """Check the status of a password reset request"""
    try:
        reset_request = PasswordResetRequest.objects.get(id=request_id)
        return Response({
            'status': reset_request.status,
            'created_at': reset_request.created_at,
            'approved_at': reset_request.approved_at,
            'admin_notes': reset_request.admin_notes if reset_request.status != PasswordResetRequest.Status.PENDING else None,
        }, status=status.HTTP_200_OK)
    except PasswordResetRequest.DoesNotExist:
        return Response(
            {'error': 'Reset request not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """Confirm password reset with token (after admin approval)"""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    token = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']
    
    try:
        reset_request = PasswordResetRequest.objects.get(token=token)
        
        if not reset_request.can_reset_password():
            if reset_request.is_expired():
                reset_request.status = PasswordResetRequest.Status.EXPIRED
                reset_request.save()
                return Response(
                    {'error': 'Password reset token has expired. Please request a new one.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'This password reset request is not approved or has been used.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Reset the password
        with transaction.atomic():
            user = reset_request.user
            user.set_password(new_password)
            user.save()
            
            reset_request.status = PasswordResetRequest.Status.COMPLETED
            reset_request.completed_at = timezone.now()
            reset_request.save()
            
            # Log the password reset
            log_admin_action(
                admin_user=reset_request.approved_by,
                action=AdminActivityLog.Action.RESET_PASSWORD,
                description=f"Password reset completed for {user.email}",
                target_user=user,
                metadata={'request_id': str(reset_request.id)},
                request=request
            )
        
        return Response({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }, status=status.HTTP_200_OK)
        
    except PasswordResetRequest.DoesNotExist:
        return Response(
            {'error': 'Invalid or expired reset token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


# Admin ViewSets

class PasswordResetRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing password reset requests (Admin only)"""
    queryset = PasswordResetRequest.objects.all()
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [IsAuthenticated, CanManageUsers]
    
    def get_queryset(self):
        """Filter based on status if provided"""
        queryset = PasswordResetRequest.objects.all()
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a password reset request"""
        reset_request = self.get_object()
        
        if reset_request.status != PasswordResetRequest.Status.PENDING:
            return Response(
                {'error': 'Only pending requests can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PasswordResetApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            reset_request.status = PasswordResetRequest.Status.APPROVED
            reset_request.approved_by = request.user
            reset_request.approved_at = timezone.now()
            reset_request.admin_notes = serializer.validated_data.get('admin_notes', '')
            reset_request.save()
            
            # Log the approval
            log_admin_action(
                admin_user=request.user,
                action=AdminActivityLog.Action.APPROVE_RESET,
                description=f"Approved password reset for {reset_request.user.email}",
                target_user=reset_request.user,
                metadata={
                    'request_id': str(reset_request.id),
                    'admin_notes': reset_request.admin_notes
                },
                request=request
            )
        
        return Response({
            'message': 'Password reset request approved.',
            'token': reset_request.token,
            'request': PasswordResetRequestSerializer(reset_request).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a password reset request"""
        reset_request = self.get_object()
        
        if reset_request.status != PasswordResetRequest.Status.PENDING:
            return Response(
                {'error': 'Only pending requests can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PasswordResetApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            reset_request.status = PasswordResetRequest.Status.REJECTED
            reset_request.approved_by = request.user
            reset_request.approved_at = timezone.now()
            reset_request.admin_notes = serializer.validated_data.get('admin_notes', '')
            reset_request.save()
            
            # Log the rejection
            log_admin_action(
                admin_user=request.user,
                action=AdminActivityLog.Action.REJECT_RESET,
                description=f"Rejected password reset for {reset_request.user.email}",
                target_user=reset_request.user,
                metadata={
                    'request_id': str(reset_request.id),
                    'admin_notes': reset_request.admin_notes
                },
                request=request
            )
        
        return Response({
            'message': 'Password reset request rejected.',
            'request': PasswordResetRequestSerializer(reset_request).data
        }, status=status.HTTP_200_OK)


class AdminActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing admin activity logs (Admin only)"""
    queryset = AdminActivityLog.objects.all()
    serializer_class = AdminActivityLogSerializer
    permission_classes = [IsAuthenticated, CanManageUsers]
    
    def get_queryset(self):
        """Filter logs based on query parameters"""
        queryset = AdminActivityLog.objects.all()
        
        # Filter by action
        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by admin user
        admin_user_id = self.request.query_params.get('admin_user', None)
        if admin_user_id:
            queryset = queryset.filter(admin_user_id=admin_user_id)
        
        # Filter by target user
        target_user_id = self.request.query_params.get('target_user', None)
        if target_user_id:
            queryset = queryset.filter(target_user_id=target_user_id)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset


# System Monitoring Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated, CanManageUsers])
def system_status(request):
    """Get system status and health metrics (Admin only)"""
    from .system_monitoring import get_system_status
    
    try:
        status_data = get_system_status()
        return Response(status_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        return Response(
            {'error': 'Unable to retrieve system status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanManageUsers])
def user_activity_stats(request):
    """Get user activity statistics (Admin only)"""
    from .system_monitoring import get_user_activity_stats, get_user_role_distribution
    
    days = int(request.query_params.get('days', 7))
    
    try:
        activity_stats = get_user_activity_stats(days)
        role_distribution = get_user_role_distribution()
        
        return Response({
            'activity_stats': activity_stats,
            'role_distribution': role_distribution,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting user activity stats: {str(e)}")
        return Response(
            {'error': 'Unable to retrieve user activity statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
