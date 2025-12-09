from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer, TaskUpdateSerializer
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
        """Filter tasks based on user role"""
        user = self.request.user
        
        # Admin can see all tasks
        if user.is_admin:
            return Task.objects.select_related('assignee', 'created_by').all()
        
        # Manager can see all tasks
        if user.is_manager:
            return Task.objects.select_related('assignee', 'created_by').all()
        
        # Member can only see tasks assigned to them
        if user.is_member:
            return Task.objects.select_related('assignee', 'created_by').filter(
                assignee=user
            )
        
        return Task.objects.none()
    
    def perform_create(self, serializer):
        """Set created_by when creating a task"""
        serializer.save(created_by=self.request.user)
    
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
        
        # Add user-specific stats for members
        if user.is_member:
            user_tasks = queryset.filter(assignee=user)
            stats['my_total'] = user_tasks.count()
            stats['my_todo'] = user_tasks.filter(status=Task.TODO).count()
            stats['my_in_progress'] = user_tasks.filter(status=Task.IN_PROGRESS).count()
            stats['my_done'] = user_tasks.filter(status=Task.DONE).count()
        
        return Response(stats)
