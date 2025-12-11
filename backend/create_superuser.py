#!/usr/bin/env python
"""
Script to create a Django superuser non-interactively
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

# Create superuser
email = input("Enter email: ")
username = input("Enter username: ")
password = input("Enter password: ")

# Create superuser
user = User.objects.create_user(
    email=email,
    username=username,
    password=password,
    is_staff=True,
    is_superuser=True
)

print(f"\nSuperuser created successfully!")
print(f"Email: {user.email}")
print(f"Username: {user.username}")
print(f"Role: {user.role.get_name_display() if user.role else 'None'}")

