from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tasks.models import Project, Task, Comment, Notification, ActivityLog
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed demo data: roles, users, projects, tasks, comments, notifications, activity logs'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        # Create demo users
        admin, _ = User.objects.get_or_create(
            email='admin@ttms.com',
            defaults={'username': 'admin', 'role': User.Role.ADMIN}
        )
        admin.set_password('admin123')
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        manager, _ = User.objects.get_or_create(
            email='manager@ttms.com',
            defaults={'username': 'manager', 'role': User.Role.MANAGER}
        )
        manager.set_password('manager123')
        manager.save()

        member, _ = User.objects.get_or_create(
            email='member@ttms.com',
            defaults={'username': 'member', 'role': User.Role.MEMBER}
        )
        member.set_password('member123')
        member.save()

        # Create a sample project
        project, _ = Project.objects.get_or_create(
            name='Demo Project',
            defaults={
                'description': 'A demo project for TTMS',
                'start_date': timezone.now().date(),
                'end_date': None,
                'manager': manager,
            }
        )
        project.members.add(member)
        project.save()

        # Create sample tasks
        t1, _ = Task.objects.get_or_create(
            title='Setup repository',
            defaults={
                'description': 'Initialize repo and CI',
                'status': Task.TODO,
                'deadline': timezone.now() + timezone.timedelta(days=7),
                'created_by': admin,
                'assignee': member,
            }
        )
        t2, _ = Task.objects.get_or_create(
            title='Design schema',
            defaults={
                'description': 'Design DB schema for projects/tasks',
                'status': Task.IN_PROGRESS,
                'deadline': timezone.now() + timezone.timedelta(days=3),
                'created_by': manager,
                'assignee': member,
            }
        )

        # Link tasks to project (if you prefer tasks to have a project FK, skip)
        # For now, just create comments and notifications
        Comment.objects.get_or_create(task=t1, author=member, content='I will start this task')
        Notification.objects.get_or_create(user=member, task=t1, type=Notification.TASK_ASSIGNED, message='You were assigned to Setup repository')

        # Activity logs
        ActivityLog.objects.create(user=admin, action='created_user', model='User', object_id=str(admin.id), detail={'email': admin.email})
        ActivityLog.objects.create(user=manager, action='created_project', model='Project', object_id=str(project.id), detail={'project': project.name})

        self.stdout.write(self.style.SUCCESS('Demo data seeded.'))
