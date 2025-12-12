from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    role_display = serializers.CharField(source="get_role_display", read_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices, required=False)
    password = serializers.CharField(
        write_only=True, required=False, validators=[validate_password]
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "middle_name",
            "last_name",
            "role",
            "role_display",
            "profile_image",
            "phone_number",
            "is_active",
            "password",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {"email": {"required": True}, "username": {"required": True}}

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(
        choices=[User.Role.MEMBER, User.Role.MANAGER],
        required=False,
        default=User.Role.MEMBER,
    )

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password_confirm",
            "first_name",
            "middle_name",
            "last_name",
            "role",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        role_value = validated_data.pop("role", User.Role.MEMBER)
        if role_value not in {User.Role.MEMBER, User.Role.MANAGER}:
            role_value = User.Role.MEMBER
            
        # Set is_staff=True for all new members by default
        is_staff = role_value == User.Role.MEMBER
        
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            middle_name=validated_data.get("middle_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=role_value,
            is_staff=is_staff,  # Set is_staff based on role
        )
        if role_value == User.Role.MEMBER:
            user.is_staff = True
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile (read-only for own profile)"""

    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "middle_name",
            "last_name",
            "role",
            "role_display",
            "profile_image",
            "phone_number",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "email", "role", "created_at", "updated_at"]

