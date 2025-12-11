from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Task, Notification, Comment
from .serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    NotificationSerializer,
    CommentSerializer,
)
from users.permissions import CanManageTasks, CanEditTask, CanDeleteTask, CanAssignTasks


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task management"""
    queryset = Task.objects.select_related('assignee', 'created_by').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'deadline']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        return TaskSerializer
    
    def get_permissions(self):
        """Assign permissions based on action"""
        if self.action in ['create']:
            permission_classes = [IsAuthenticated, CanManageTasks]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, CanEditTask]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, CanDeleteTask]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter tasks based on user role and query parameters"""
        user = self.request.user
        
        # Base queryset based on user role
        if user.is_admin:
            queryset = Task.objects.select_related('assignee', 'created_by').all()
        elif user.is_manager:
            queryset = Task.objects.select_related('assignee', 'created_by').all()
        elif user.is_member:
            queryset = Task.objects.select_related('assignee', 'created_by').filter(
                assignee=user
            )
        else:
            return Task.objects.none()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by assignee if provided
        assignee_filter = self.request.query_params.get('assignee', None)
        if assignee_filter:
            queryset = queryset.filter(assignee_id=assignee_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by when creating a task"""
        task = serializer.save(created_by=self.request.user)
        if task.assignee:
            Notification.objects.create(
                user=task.assignee,
                task=task,
                type=Notification.TASK_ASSIGNED,
                message=f"You were assigned to '{task.title}'.",
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAssignTasks])
    def assign(self, request, pk=None):
        """Assign task to a user (Admin/Manager only)"""
        task = self.get_object()
        assignee_id = request.data.get('assignee_id')
        
        if not assignee_id:
            return Response(
                {'error': 'assignee_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from users.models import User
        try:
            assignee = User.objects.get(id=assignee_id)
            task.assignee = assignee
            task.save()
            Notification.objects.create(
                user=assignee,
                task=task,
                type=Notification.TASK_ASSIGNED,
                message=f"You were assigned to '{task.title}'.",
            )
            return Response({
                'message': f'Task assigned to {assignee.email}',
                'task': TaskSerializer(task).data
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to current user"""
        tasks = self.get_queryset().filter(assignee=request.user)
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get task statistics"""
        user = request.user
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'todo': queryset.filter(status=Task.TODO).count(),
            'in_progress': queryset.filter(status=Task.IN_PROGRESS).count(),
            'done': queryset.filter(status=Task.DONE).count(),
        }
        
        # Add user-specific stats for members and managers (who also work on tasks)
        if user.is_member or user.is_manager:
            user_tasks = queryset.filter(assignee=user)
            stats['my_total'] = user_tasks.count()
            stats['my_todo'] = user_tasks.filter(status=Task.TODO).count()
            stats['my_in_progress'] = user_tasks.filter(status=Task.IN_PROGRESS).count()
            stats['my_done'] = user_tasks.filter(status=Task.DONE).count()
        
        return Response(stats)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        task = serializer.save()
        # Notify managers/creators on key status changes
        if old_status != task.status:
            if task.status == Task.IN_PROGRESS and task.created_by:
                Notification.objects.create(
                    user=task.created_by,
                    task=task,
                    type=Notification.TASK_STARTED,
                    message=f"Task '{task.title}' was started.",
                )
            if task.status == Task.DONE and task.created_by:
                Notification.objects.create(
                    user=task.created_by,
                    task=task,
                    type=Notification.TASK_DONE,
                    message=f"Task '{task.title}' was completed.",
                )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, CanAssignTasks])
    def unassign(self, request, pk=None):
        """Unassign a task (Admin/Manager only)"""
        task = self.get_object()
        if not task.assignee:
            return Response({"message": "Task already unassigned"})
        task.assignee = None
        task.save()
        return Response({"message": "Task unassigned", "task": TaskSerializer(task).data})

    @action(detail=True, methods=["get", "post"], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        """List or add comments to a task"""
        task = self.get_object()

        if request.method.lower() == "get":
            qs = task.comments.select_related("author").all()
            return Response(CommentSerializer(qs, many=True).data)

        # POST
        content = request.data.get("content")
        if not content:
            return Response({"error": "content is required"}, status=status.HTTP_400_BAD_REQUEST)
        comment = Comment.objects.create(task=task, author=request.user, content=content)
        # notify assignee and creator (except author)
        recipients = set()
        if task.assignee and task.assignee != request.user:
            recipients.add(task.assignee)
        if task.created_by and task.created_by != request.user:
            recipients.add(task.created_by)
        for u in recipients:
            Notification.objects.create(
                user=u,
                task=task,
                type=Notification.TASK_COMMENTED,
                message=f"New comment on '{task.title}': {content[:80]}",
            )
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Notifications for the current user"""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_read(self, request):
        """Mark a notification as read"""
        notif_id = request.data.get("id")
        if not notif_id:
            return Response({"error": "id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            notif = Notification.objects.get(id=notif_id, user=request.user)
            notif.is_read = True
            notif.save()
            return Response({"message": "Marked read"})
        except Notification.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked read"})
