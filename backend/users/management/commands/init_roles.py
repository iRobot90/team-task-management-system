from django.core.management.base import BaseCommand
class Command(BaseCommand):
    help = "Roles are now defined as choices on the User model; no DB roles to init."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("No action needed."))

