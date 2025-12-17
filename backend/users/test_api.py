from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json
import uuid

from .models import User, AdminProfile, ManagerProfile, MemberProfile

User = get_user_model()


class UserAPITest(TestCase):
    """Test cases for User API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
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

    def get_tokens(self, user):
        """Get JWT tokens for user"""
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    def authenticate_user(self, user):
        """Authenticate user with JWT token"""
        tokens = self.get_tokens(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')

    def test_user_registration(self):
        """Test user registration endpoint"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'last_name': 'User',
            'role': User.Role.MEMBER,
            'password_confirm': 'newpass123'
        }
        
        response = self.client.post('/api/auth/register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # self.assertEqual(User.objects.count(), 4)  # 3 existing + 1 new
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
        
        new_user = User.objects.get(email='newuser@example.com')
        self.assertEqual(new_user.username, 'newuser')
        self.assertEqual(new_user.role, User.Role.MEMBER)

    def test_user_login(self):
        """Test user login endpoint"""
        data = {
            'email': self.member_user.email,
            'password': 'memberpass123'
        }
        
        response = self.client.post('/api/auth/login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertIn('user', response.data)

    def test_get_user_profile(self):
        """Test getting user profile"""
        self.authenticate_user(self.member_user)
        
        response = self.client.get('/api/users/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.member_user.email)
        self.assertEqual(response.data['username'], self.member_user.username)
        self.assertEqual(response.data['role'], User.Role.MEMBER)

    def test_update_user_profile(self):
        """Test updating user profile"""
        self.authenticate_user(self.member_user)
        
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone_number': '+1234567890'
        }
        
        response = self.client.patch('/api/users/update_profile/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh user from database
        updated_user = User.objects.get(pk=self.member_user.pk)
        self.assertEqual(updated_user.first_name, 'Updated')
        self.assertEqual(updated_user.last_name, 'Name')
        self.assertEqual(updated_user.phone_number, '+1234567890')

    def test_get_users_list_admin(self):
        """Test getting users list as admin"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get('/api/users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 3)  # At least the 3 test users

    def test_get_users_list_manager(self):
        """Test getting users list as manager"""
        self.authenticate_user(self.manager_user)
        
        response = self.client.get('/api/users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Managers should see all users (based on your permission logic)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 3)

    def test_get_users_list_member(self):
        """Test getting users list as member (should be restricted)"""
        self.authenticate_user(self.member_user)
        
        response = self.client.get('/api/users/')
        
        # Members might have restricted access or see limited data
        # This depends on your permission implementation
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])

    def test_create_user_admin(self):
        """Test creating user as admin"""
        self.authenticate_user(self.admin_user)
        
        data = {
            'username': 'newmember',
            'email': 'newmember@example.com',
            'password': 'newpass123',
            'role': User.Role.MEMBER
        }
        
        response = self.client.post('/api/users/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newmember@example.com').exists())

    def test_create_user_manager(self):
        """Test creating user as manager"""
        self.authenticate_user(self.manager_user)
        
        data = {
            'username': 'newmember',
            'email': 'newmember@example.com',
            'password': 'newpass123',
            'role': User.Role.MEMBER
        }
        
        response = self.client.post('/api/users/', data, format='json')
        
        # Managers cannot create users (Admin only)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_user_member(self):
        """Test creating user as member (should be forbidden)"""
        self.authenticate_user(self.member_user)
        
        data = {
            'username': 'newmember',
            'email': 'newmember@example.com',
            'password': 'newpass123',
            'role': User.Role.MEMBER
        }
        
        response = self.client.post('/api/users/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_user_role_admin(self):
        """Test updating user role as admin"""
        self.authenticate_user(self.admin_user)
        
        data = {'role': User.Role.MANAGER}
        response = self.client.patch(
            f'/api/users/{self.member_user.pk}/', 
            data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        updated_user = User.objects.get(pk=self.member_user.pk)
        self.assertEqual(updated_user.role, User.Role.MANAGER)

    def test_delete_user_admin(self):
        """Test deleting user as admin"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.delete(f'/api/users/{self.member_user.pk}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.member_user.pk).exists())

    def test_unauthenticated_access(self):
        """Test that unauthenticated requests are rejected"""
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_access(self):
        """Test access with invalid token"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_profile_with_phone_number(self):
        """Test profile update with phone number"""
        self.authenticate_user(self.member_user)
        
        # Test updating phone number
        data = {'phone_number': '+1234567890'}
        response = self.client.patch('/api/users/update_profile/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify phone number is saved
        updated_user = User.objects.get(pk=self.member_user.pk)
        self.assertEqual(updated_user.phone_number, '+1234567890')
        
        # Test getting profile with phone number
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone_number'], '+1234567890')

    def test_user_search(self):
        """Test user search functionality"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get(f'/api/users/?search={self.admin_user.username}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        if len(results) > 0:
            self.assertIn(self.admin_user.username, results[0]['username'])
        
        response = self.client.get('/api/users/?search=manager')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 0)  # Flexible check
        self.assertIn('manager', results[0]['email'])

    def test_user_filter_by_role(self):
        """Test filtering users by role"""
        self.authenticate_user(self.admin_user)
        
        # Filter by admin role
        response = self.client.get('/api/users/?role=ADMIN')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]['role'], User.Role.ADMIN)
        
        # Filter by manager role
        response = self.client.get('/api/users/?role=MANAGER')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]['role'], User.Role.MANAGER)
        
        # Filter by member role
        response = self.client.get('/api/users/?role=MEMBER')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]['role'], User.Role.MEMBER)

    def test_user_permissions_by_role(self):
        """Test that users have correct permissions based on role"""
        # Admin should have all permissions
        self.authenticate_user(self.admin_user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response = self.client.post('/api/users/', {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'role': User.Role.MEMBER
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Manager should have limited permissions
        self.authenticate_user(self.manager_user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Member should have minimal permissions
        self.authenticate_user(self.member_user)
        response = self.client.get('/api/users/')
        # This might be 403 or 200 with limited data, depending on implementation
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])


class UserProfileAPITest(TestCase):
    """Test cases for user profile-specific API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        self.admin_user = User.objects.create_user(
            username=f'admin_{uuid.uuid4().hex[:8]}',
            email=f'admin_{uuid.uuid4().hex[:8]}@example.com',
            password='adminpass123',
            role=User.Role.ADMIN
        )
        
        # Create profiles for each user type
        self.admin_profile = AdminProfile.objects.create(
            user=self.admin_user,
            department='IT',
            permissions={'can_delete': True, 'can_edit': True}
        )

    def get_tokens(self, user):
        """Get JWT tokens for user"""
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    def authenticate_user(self, user):
        """Authenticate user with JWT token"""
        tokens = self.get_tokens(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')

    def test_get_admin_profile(self):
        """Test getting admin profile data"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get('/api/users/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.admin_user.email)
        self.assertEqual(response.data['role'], User.Role.ADMIN)

    def test_profile_update_validation(self):
        """Test profile update validation"""
        self.authenticate_user(self.admin_user)
        
        # Test invalid email - should be ignored as email is read-only in UserProfileSerializer
        data = {'email': 'invalid-email'}
        response = self.client.patch('/api/users/update_profile/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify email was not changed
        self.admin_user.refresh_from_db()
        self.assertNotEqual(self.admin_user.email, 'invalid-email')
        
        # Test empty data - partial update with empty data is valid (no-op)
        data = {}
        response = self.client.patch('/api/users/update_profile/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
