from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import uuid

from .models import Task, Comment as TaskComment

User = get_user_model()


class TaskModelTest(TestCase):
    """Test cases for Task model"""

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username=f'admin_{uuid.uuid4().hex[:8]}',
            email=f'admin_{uuid.uuid4().hex[:8]}@example.com',
            password='adminpass123',
            role=User.Role.ADMIN
        )
        
        self.manager_user = User.objects.create_user(
            username=f'manager_{uuid.uuid4().hex[:8]}',
            email=f'manager_{uuid.uuid4().hex[:8]}@example.com',
            password='managerpass123',
            role=User.Role.MANAGER
        )
        
        self.member_user = User.objects.create_user(
            username=f'member_{uuid.uuid4().hex[:8]}',
            email=f'member_{uuid.uuid4().hex[:8]}@example.com',
            password='memberpass123',
            role=User.Role.MEMBER
        )

    def test_create_task(self):
        """Test creating a task"""
        task = Task.objects.create(
            title='Test Task',
            description='This is a test task',
            created_by=self.admin_user,
            assignee=self.member_user,
            status=Task.TODO
        )
        
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.description, 'This is a test task')
        self.assertEqual(task.created_by, self.admin_user)
        self.assertEqual(task.assignee, self.member_user)
        self.assertEqual(task.status, Task.TODO)
        self.assertIsNotNone(task.id)
        self.assertIsInstance(task.id, int)

    def test_task_status_choices(self):
        """Test task status choices"""
        task = Task.objects.create(
            title='Test Task',
            created_by=self.admin_user,
            status=Task.TODO
        )
        
        # Test TODO status
        self.assertEqual(task.status, Task.TODO)
        
        # Test IN_PROGRESS status
        task.status = Task.IN_PROGRESS
        task.save()
        self.assertEqual(task.status, Task.IN_PROGRESS)
        
        # Test DONE status
        task.status = Task.DONE
        task.save()
        self.assertEqual(task.status, Task.DONE)



    def test_task_deadline(self):
        """Test task deadline functionality"""
        future_date = timezone.now() + timedelta(days=7)
        
        task = Task.objects.create(
            title='Test Task',
            created_by=self.admin_user,
            deadline=future_date
        )
        
        self.assertEqual(task.deadline, future_date)
        
        # Test null deadline
        task_no_deadline = Task.objects.create(
            title='No Deadline Task',
            created_by=self.admin_user
        )
        self.assertIsNone(task_no_deadline.deadline)

    def test_task_timestamps(self):
        """Test created_at and updated_at timestamps"""
        task = Task.objects.create(
            title='Test Task',
            created_by=self.admin_user
        )
        
        # Test created_at is set
        self.assertIsNotNone(task.created_at)
        self.assertIsInstance(task.created_at, datetime)
        
        # Test updated_at is set initially
        self.assertIsNotNone(task.updated_at)
        self.assertIsInstance(task.updated_at, datetime)
        
        # Test that updated_at changes when we update
        original_updated = task.updated_at
        task.title = 'Updated Task'
        task.save()
        
        self.assertNotEqual(task.updated_at, original_updated)
        self.assertGreater(task.updated_at, original_updated)

    def test_task_str_representation(self):
        """Test string representation of task"""
        task = Task.objects.create(
            title='Test Task',
            created_by=self.admin_user
        )
        
        expected = 'Test Task - Todo'
        self.assertEqual(str(task), expected)

    def test_task_ordering(self):
        """Test default ordering of tasks"""
        task1 = Task.objects.create(
            title='Task 1',
            created_by=self.admin_user
        )
        
        # Add a small delay to ensure different timestamps
        import time
        time.sleep(0.1)
        
        task2 = Task.objects.create(
            title='Task 2',
            created_by=self.admin_user
        )
        
        tasks = list(Task.objects.all())
        self.assertEqual(tasks[0], task2)  # Most recent first
        self.assertEqual(tasks[1], task1)

    def test_task_assignee_relationship(self):
        """Test task-assignee relationship"""
        task = Task.objects.create(
            title='Test Task',
            created_by=self.admin_user,
            assignee=self.member_user
        )
        
        # Test forward relationship
        self.assertEqual(task.assignee, self.member_user)
        
        # Test reverse relationship (if implemented)
        # This depends on whether you have a related_name in the model
        if hasattr(self.member_user, 'assigned_tasks'):
            self.assertIn(task, self.member_user.assigned_tasks.all())

    def test_task_creator_relationship(self):
        """Test task-creator relationship"""
        task = Task.objects.create(
            title='Test Task',
            created_by=self.admin_user
        )
        
        # Test forward relationship
        self.assertEqual(task.created_by, self.admin_user)
        
        # Test reverse relationship (if implemented)
        if hasattr(self.admin_user, 'created_tasks'):
            self.assertIn(task, self.admin_user.created_tasks.all())

    def test_task_without_assignee(self):
        """Test creating task without assignee"""
        task = Task.objects.create(
            title='Unassigned Task',
            created_by=self.admin_user
        )
        
        self.assertIsNone(task.assignee)
        self.assertIsNotNone(task.created_by)

    def test_task_with_all_fields(self):
        """Test creating task with all possible fields"""
        future_date = timezone.now() + timedelta(days=7)
        
        task = Task.objects.create(
            title='Complete Task',
            description='This is a comprehensive task',
            created_by=self.admin_user,
            assignee=self.member_user,
            status=Task.IN_PROGRESS,
            deadline=future_date
        )
        
        self.assertEqual(task.title, 'Complete Task')
        self.assertEqual(task.description, 'This is a comprehensive task')
        self.assertEqual(task.created_by, self.admin_user)
        self.assertEqual(task.assignee, self.member_user)
        self.assertEqual(task.status, Task.IN_PROGRESS)
        self.assertEqual(task.deadline, future_date)


class TaskCommentModelTest(TestCase):
    """Test cases for TaskComment model"""

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username=f'admin_{uuid.uuid4().hex[:8]}',
            email=f'admin_{uuid.uuid4().hex[:8]}@example.com',
            password='adminpass123',
            role=User.Role.ADMIN
        )
        
        self.member_user = User.objects.create_user(
            username=f'member_{uuid.uuid4().hex[:8]}',
            email=f'member_{uuid.uuid4().hex[:8]}@example.com',
            password='memberpass123',
            role=User.Role.MEMBER
        )
        
        self.task = Task.objects.create(
            title='Test Task',
            description='This is a test task',
            created_by=self.admin_user,
            assignee=self.member_user
        )

    def test_create_task_comment(self):
        """Test creating a task comment"""
        comment = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='This is a comment'
        )
        
        self.assertEqual(comment.task, self.task)
        self.assertEqual(comment.author, self.member_user)
        self.assertEqual(comment.content, 'This is a comment')
        self.assertIsNotNone(comment.id)
        self.assertIsInstance(comment.id, uuid.UUID)

    def test_comment_timestamps(self):
        """Test created_at timestamp for comments"""
        comment = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='Test comment'
        )
        
        # Test created_at is set
        self.assertIsNotNone(comment.created_at)
        self.assertIsInstance(comment.created_at, datetime)

    def test_comment_str_representation(self):
        """Test string representation of task comment"""
        comment = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='This is a comment'
        )
        
        # The exact string representation depends on your model's __str__ method
        # This is a common implementation
        expected = f'Comment by {self.member_user} on {self.task}'
        self.assertEqual(str(comment), expected)

    def test_comment_ordering(self):
        """Test default ordering of comments"""
        comment1 = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='First comment'
        )
        
        # Add a small delay
        import time
        time.sleep(0.1)
        
        comment2 = TaskComment.objects.create(
            task=self.task,
            author=self.admin_user,
            content='Second comment'
        )
        
        comments = list(TaskComment.objects.all())
        # Default ordering is by creation time (created_at).
        # Check if comments roughly match order. Note: exact millisecond handling might vary by DB.
        self.assertEqual(len(comments), 2)
        # Assuming Comment default ordering is 'created_at' (ascending)
        self.assertEqual(comments[0], comment1)
        self.assertEqual(comments[1], comment2)

    def test_comment_task_relationship(self):
        """Test comment-task relationship"""
        comment = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='Test comment'
        )
        
        # Test forward relationship
        self.assertEqual(comment.task, self.task)
        
        # Test reverse relationship (if implemented)
        if hasattr(self.task, 'comments'):
            self.assertIn(comment, self.task.comments.all())

    def test_comment_author_relationship(self):
        """Test comment-author relationship"""
        comment = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='Test comment'
        )
        
        # Test forward relationship
        self.assertEqual(comment.author, self.member_user)
        
        # Test reverse relationship (if implemented)
        if hasattr(self.member_user, 'comments'):
            self.assertIn(comment, self.member_user.comments.all())

    def test_multiple_comments_per_task(self):
        """Test having multiple comments on a single task"""
        comment1 = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='Comment from member'
        )
        
        comment2 = TaskComment.objects.create(
            task=self.task,
            author=self.admin_user,
            content='Comment from admin'
        )
        
        comment3 = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='Another comment from member'
        )
        
        # Test all comments are associated with the task
        if hasattr(self.task, 'comments'):
            task_comments = self.task.comments.all()
            self.assertEqual(task_comments.count(), 3)
            self.assertIn(comment1, task_comments)
            self.assertIn(comment2, task_comments)
            self.assertIn(comment3, task_comments)

    def test_comments_across_different_tasks(self):
        """Test comments on different tasks"""
        task2 = Task.objects.create(
            title='Second Task',
            created_by=self.admin_user
        )
        
        comment1 = TaskComment.objects.create(
            task=self.task,
            author=self.member_user,
            content='Comment on first task'
        )
        
        comment2 = TaskComment.objects.create(
            task=task2,
            author=self.member_user,
            content='Comment on second task'
        )
        
        # Test comments are correctly associated with their respective tasks
        if hasattr(self.task, 'comments') and hasattr(task2, 'comments'):
            self.assertEqual(self.task.comments.count(), 1)
            self.assertEqual(task2.comments.count(), 1)
            self.assertIn(comment1, self.task.comments.all())
            self.assertIn(comment2, task2.comments.all())


class TaskIntegrationTest(TestCase):
    """Integration tests for Task and TaskComment models"""

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username=f'admin_{uuid.uuid4().hex[:8]}',
            email=f'admin_{uuid.uuid4().hex[:8]}@example.com',
            password='adminpass123',
            role=User.Role.ADMIN
        )
        
        self.manager_user = User.objects.create_user(
            username=f'manager_{uuid.uuid4().hex[:8]}',
            email=f'manager_{uuid.uuid4().hex[:8]}@example.com',
            password='managerpass123',
            role=User.Role.MANAGER
        )
        
        self.member_user = User.objects.create_user(
            username=f'member_{uuid.uuid4().hex[:8]}',
            email=f'member_{uuid.uuid4().hex[:8]}@example.com',
            password='memberpass123',
            role=User.Role.MEMBER
        )

    def test_task_lifecycle_with_comments(self):
        """Test complete task lifecycle with comments"""
        # Create task
        task = Task.objects.create(
            title='Development Task',
            description='Implement new feature',
            created_by=self.manager_user,
            assignee=self.member_user,
            status=Task.TODO
        )
        
        # Add initial comment
        comment1 = TaskComment.objects.create(
            task=task,
            author=self.manager_user,
            content='Please work on this task'
        )
        
        # Update task status
        task.status = Task.IN_PROGRESS
        task.save()
        
        # Add progress comment
        comment2 = TaskComment.objects.create(
            task=task,
            author=self.member_user,
            content='Started working on this'
        )
        
        # Complete task
        task.status = Task.DONE
        task.save()
        
        # Add completion comment
        comment3 = TaskComment.objects.create(
            task=task,
            author=self.member_user,
            content='Task completed successfully'
        )
        
        # Verify final state
        self.assertEqual(task.status, Task.DONE)
        if hasattr(task, 'comments'):
            self.assertEqual(task.comments.count(), 3)
        
        # Verify comment timestamps are in correct order
        self.assertLess(comment1.created_at, comment2.created_at)
        self.assertLess(comment2.created_at, comment3.created_at)

    def test_task_assignment_workflow(self):
        """Test task assignment workflow"""
        # Create unassigned task
        task = Task.objects.create(
            title='New Task',
            description='Task description',
            created_by=self.admin_user,
            status=Task.TODO
        )
        
        self.assertIsNone(task.assignee)
        
        # Assign task to member
        task.assignee = self.member_user
        task.save()
        
        self.assertEqual(task.assignee, self.member_user)
        
        # Add comment about assignment
        TaskComment.objects.create(
            task=task,
            author=self.admin_user,
            content='Task assigned to you'
        )
        
        # Verify assignment and comment
        self.assertEqual(task.assignee, self.member_user)
        if hasattr(task, 'comments'):
            self.assertEqual(task.comments.count(), 1)

    def test_task_deadline_tracking(self):
        """Test task deadline functionality"""
        # Create task with deadline
        deadline = timezone.now() + timedelta(days=3)
        task = Task.objects.create(
            title='Urgent Task',
            created_by=self.admin_user,
            assignee=self.member_user,
            deadline=deadline
        )
        
        self.assertEqual(task.deadline, deadline)
        
        # Test if task is overdue (this would depend on your model methods)
        # If you have an is_overdue method:
        # if hasattr(task, 'is_overdue'):
        #     self.assertFalse(task.is_overdue())  # Should not be overdue yet
        
        # Test task past deadline
        past_deadline = timezone.now() - timedelta(days=1)
        task.deadline = past_deadline
        task.save()
        
        # if hasattr(task, 'is_overdue'):
        #     self.assertTrue(task.is_overdue())  # Should be overdue

    def test_multiple_users_task_interaction(self):
        """Test multiple users interacting with the same task"""
        task = Task.objects.create(
            title='Team Task',
            description='Task requiring collaboration',
            created_by=self.admin_user,
            assignee=self.member_user,
            status=Task.TODO
        )
        
        # Admin adds initial comment
        admin_comment = TaskComment.objects.create(
            task=task,
            author=self.admin_user,
            content='Please review and start this task'
        )
        
        # Member acknowledges
        member_comment1 = TaskComment.objects.create(
            task=task,
            author=self.member_user,
            content='Got it, I will start working on this'
        )
        
        # Manager adds guidance
        manager_comment = TaskComment.objects.create(
            task=task,
            author=self.manager_user,
            content='Let me know if you need any help'
        )
        
        # Member updates status and comments
        task.status = Task.IN_PROGRESS
        task.save()
        
        member_comment2 = TaskComment.objects.create(
            task=task,
            author=self.member_user,
            content='Started working on the task'
        )
        
        # Verify all interactions
        self.assertEqual(task.status, Task.IN_PROGRESS)
        if hasattr(task, 'comments'):
            self.assertEqual(task.comments.count(), 4)
            
            # Verify all authors are represented
            comment_authors = [comment.author for comment in task.comments.all()]
            self.assertIn(self.admin_user, comment_authors)
            self.assertIn(self.manager_user, comment_authors)
            self.assertIn(self.member_user, comment_authors)
