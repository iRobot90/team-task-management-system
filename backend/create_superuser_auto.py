#!/usr/bin/env python
"""
Script to create a Django superuser with predefined credentials
Modify the credentials below before running
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Role

# MODIFY THESE VALUES
EMAIL = "admin@ttms.com"
USERNAME = "admin"
PASSWORD = "admin123"  # Change this to a secure password

# Get or create admin role
admin_role, _ = Role.objects.get_or_create(name=Role.ADMIN)

# Check if user already exists
if User.objects.filter(email=EMAIL).exists():
    print(f"User with email {EMAIL} already exists!")
    user = User.objects.get(email=EMAIL)
    user.role = admin_role
    user.is_staff = True
    user.is_superuser = True
    user.set_password(PASSWORD)
    user.save()
    print(f"Updated existing user to superuser with admin role")
else:
    # Create superuser
    user = User.objects.create_user(
        email=EMAIL,
        username=USERNAME,
        password=PASSWORD,
        role=admin_role,
        is_staff=True,
        is_superuser=True
    )
    print(f"\nSuperuser created successfully!")

print(f"Email: {user.email}")
print(f"Username: {user.username}")
print(f"Role: {user.role.get_name_display() if user.role else 'None'}")
print(f"\nYou can now login with:")
print(f"  Email: {EMAIL}")
print(f"  Password: {PASSWORD}")

