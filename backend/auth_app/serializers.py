from rest_framework import serializers
from .models import PasswordResetRequest, AdminActivityLog
from users.serializers import UserSerializer


class PasswordResetRequestSerializer(serializers.ModelSerializer):
    """Serializer for creating password reset requests"""
    user_email = serializers.EmailField(write_only=True)
    user = UserSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = PasswordResetRequest
        fields = [
            'id', 'user', 'user_email', 'status', 'reason', 
            'admin_notes', 'approved_by', 'created_at', 
            'approved_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'admin_notes', 'approved_by',
            'created_at', 'approved_at', 'expires_at'
        ]
    
    def validate_user_email(self, value):
        """Validate that the user exists"""
        from users.models import User
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address.")
        return value


class PasswordResetApprovalSerializer(serializers.Serializer):
    """Serializer for admin approval/rejection of password reset"""
    action = serializers.ChoiceField(choices=['approve', 'reject'], required=True)
    admin_notes = serializers.CharField(required=False, allow_blank=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset with token"""
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, min_length=8, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, data):
        """Validate that passwords match"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })
        return data


class AdminActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for admin activity logs"""
    admin_user = UserSerializer(read_only=True)
    target_user = UserSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AdminActivityLog
        fields = [
            'id', 'admin_user', 'action', 'action_display', 
            'target_user', 'description', 'metadata',
            'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = fields
