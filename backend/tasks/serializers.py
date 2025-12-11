from rest_framework import serializers
from .models import Task, Notification, Comment
from users.serializers import UserSerializer


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assignee_detail = UserSerializer(source='assignee', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'status_display',
            'deadline', 'assignee', 'assignee_detail',
            'created_by', 'created_by_detail',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set created_by to the current user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks"""
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'status', 'deadline', 'assignee']
    
    def create(self, validated_data):
        # Set created_by to the current user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tasks"""
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'status', 'deadline', 'assignee']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for task notifications"""

    task_title = serializers.CharField(source="task.title", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "task",
            "task_title",
            "type",
            "message",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for task comments"""

    author_detail = UserSerializer(source="author", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "task", "author", "author_detail", "content", "created_at"]
        read_only_fields = ["id", "created_at", "author", "task"]

