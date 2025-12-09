from django.core.management.base import BaseCommand
from users.models import Role


class Command(BaseCommand):
    help = 'Initialize default roles (Admin, Manager, Member)'

    def handle(self, *args, **options):
        roles = [
            {'name': Role.ADMIN, 'description': 'Full system access, can manage users and all tasks'},
            {'name': Role.MANAGER, 'description': 'Can create/edit/delete tasks and assign to team members'},
            {'name': Role.MEMBER, 'description': 'Can view and update only tasks assigned to them'},
        ]
        
        created_count = 0
        for role_data in roles:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={'description': role_data['description']}
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created role: {role.get_name_display()}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Role already exists: {role.get_name_display()}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully initialized {created_count} new role(s)')
        )

