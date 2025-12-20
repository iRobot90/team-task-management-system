from django.db import migrations
from django.contrib.auth import get_user_model

def create_test_users(apps, schema_editor):
    User = get_user_model()
    
    # Create admin user if it doesn't exist
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_user(
            email='admin@ttms.com',
            username='admin',
            password='admin123',
            role='ADMIN',
            first_name='Admin',
            last_name='User',
            is_staff=True,
            is_superuser=True
        )
    
    # Create manager user if it doesn't exist
    if not User.objects.filter(username='manager').exists():
        manager = User.objects.create_user(
            email='manager@ttms.com',
            username='manager',
            password='manager123',
            role='MANAGER',
            first_name='Manager',
            last_name='User'
        )
    
    # Create member user if it doesn't exist
    if not User.objects.filter(username='member').exists():
        member = User.objects.create_user(
            email='member@ttms.com',
            username='member',
            password='member123',
            role='MEMBER',
            first_name='Team',
            last_name='Member'
        )
    
    print("Test users created successfully!")

class Migration(migrations.Migration):

    dependencies = [
        # Update this with your last migration
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_test_users),
    ]