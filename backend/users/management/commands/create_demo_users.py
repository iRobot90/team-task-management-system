from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create demo users: admin@ttms.com, manager@ttms.com, member@ttms.com"

    def handle(self, *args, **options):
        from users.models import User

        demo_accounts = [
            {
                'email': 'admin@ttms.com',
                'username': 'admin',
                'password': 'admin123',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'manager@ttms.com',
                'username': 'manager',
                'password': 'manager123',
                'role': User.Role.MANAGER,
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'email': 'member@ttms.com',
                'username': 'member',
                'password': 'member123',
                'role': User.Role.MEMBER,
                'is_staff': False,
                'is_superuser': False,
            },
        ]

        for acct in demo_accounts:
            user, created = User.objects.get_or_create(email=acct['email'], defaults={
                'username': acct['username'],
            })
            user.username = acct['username']
            # set role if the field exists
            try:
                user.role = acct['role']
            except Exception:
                # ignore if role is not a simple assignment
                pass
            user.is_staff = acct['is_staff']
            user.is_superuser = acct['is_superuser']
            user.set_password(acct['password'])
            user.save()
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f"{action} user: {user.email} (role={user.role})"))

        self.stdout.write(self.style.SUCCESS("Demo users created/updated. You can now login with the credentials from DEMO_CREDENTIALS.md"))
