import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import date

from .models import User, AdminProfile, ManagerProfile, MemberProfile

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""

    def setUp(self):
        """Set up test data"""
        # Use unique usernames to avoid conflicts
        self.user_data = {
            'username': f'testuser_{uuid.uuid4().hex[:8]}',
            'email': f'test_{uuid.uuid4().hex[:8]}@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': User.Role.MEMBER
        }

    def test_create_user(self):
        """Test creating a user"""
        user = User.objects.create_user(**self.user_data)
        
        # Use the actual generated username/email from user_data
        expected_username = self.user_data['username']
        expected_email = self.user_data['email']
        
        self.assertEqual(user.username, expected_username)
        self.assertEqual(user.email, expected_email)
        self.assertEqual(user.role, User.Role.MEMBER)
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_with_email_as_username(self):
        """Test that email is used as username field"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.USERNAME_FIELD, 'email')
        self.assertEqual(user.get_username(), self.user_data['email'])

    def test_user_role_choices(self):
        """Test user role choices"""
        user = User.objects.create_user(**self.user_data)
        
        # Test default role
        self.assertEqual(user.role, User.Role.MEMBER)
        
        # Test admin role
        admin_user = User.objects.create_user(
            username=f'admin_{uuid.uuid4().hex[:8]}',
            email=f'admin_{uuid.uuid4().hex[:8]}@example.com',
            password='adminpass123',
            role=User.Role.ADMIN
        )
        self.assertEqual(admin_user.role, User.Role.ADMIN)
        
        # Test manager role
        manager_user = User.objects.create_user(
            username=f'manager_{uuid.uuid4().hex[:8]}',
            email=f'manager_{uuid.uuid4().hex[:8]}@example.com',
            password='managerpass123',
            role=User.Role.MANAGER
        )
        self.assertEqual(manager_user.role, User.Role.MANAGER)

    def test_user_phone_number(self):
        """Test phone number field"""
        user = User.objects.create_user(**self.user_data)
        
        # Test empty phone number
        self.assertIsNone(user.phone_number)
        
        # Test setting phone number
        user.phone_number = '+1234567890'
        user.save()
        self.assertEqual(user.phone_number, '+1234567890')

    def test_user_str_representation(self):
        """Test string representation of user"""
        user = User.objects.create_user(**self.user_data)
        expected = f"{user.username} ({user.role})"
        self.assertEqual(str(user), expected)

    def test_user_ordering(self):
        """Test default ordering of users"""
        user1 = User.objects.create_user(
            username=f'user1_{uuid.uuid4().hex[:8]}',
            email=f'user1_{uuid.uuid4().hex[:8]}@example.com',
            password='pass123'
        )
        user2 = User.objects.create_user(
            username=f'user2_{uuid.uuid4().hex[:8]}',
            email=f'user2_{uuid.uuid4().hex[:8]}@example.com',
            password='pass123'
        )
        
        users = list(User.objects.all())
        self.assertEqual(users[0], user2)  # Most recent first
        self.assertEqual(users[1], user1)

    def test_user_indexes(self):
        """Test database indexes are created"""
        # This is more of a migration test, but we can verify the model structure
        user = User.objects.create_user(**self.user_data)
        
        # Test that we can query by indexed fields efficiently
        user_by_email = User.objects.get(email=self.user_data['email'])
        user_by_role = User.objects.filter(role=User.Role.MEMBER).first()
        
        self.assertEqual(user, user_by_email)
        self.assertEqual(user, user_by_role)


class AdminProfileModelTest(TestCase):
    """Test cases for AdminProfile model"""

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role=User.Role.ADMIN
        )

    def test_create_admin_profile(self):
        """Test creating admin profile"""
        profile = AdminProfile.objects.create(
            user=self.admin_user,
            department='IT',
            permissions={'can_delete': True, 'can_edit': True}
        )
        
        self.assertEqual(profile.user, self.admin_user)
        self.assertEqual(profile.department, 'IT')
        self.assertEqual(profile.permissions['can_delete'], True)
        self.assertEqual(profile.permissions['can_edit'], True)

    def test_admin_profile_str_representation(self):
        """Test string representation of admin profile"""
        profile = AdminProfile.objects.create(
            user=self.admin_user,
            department='IT'
        )
        expected = f"{self.admin_user.username} - Administrator"
        self.assertEqual(str(profile), expected)

    def test_admin_profile_one_to_one(self):
        """Test one-to-one relationship with user"""
        profile = AdminProfile.objects.create(user=self.admin_user)
        
        # Test reverse relationship
        self.assertEqual(self.admin_user.admin_profile, profile)
        
        # Test that we can't create multiple profiles for same user
        with self.assertRaises(Exception):  # Should raise IntegrityError
            AdminProfile.objects.create(user=self.admin_user)


class ManagerProfileModelTest(TestCase):
    """Test cases for ManagerProfile model"""

    def setUp(self):
        """Set up test data"""
        self.manager_user = User.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='managerpass123',
            role=User.Role.MANAGER
        )

    def test_create_manager_profile(self):
        """Test creating manager profile"""
        profile = ManagerProfile.objects.create(
            user=self.manager_user,
            team='Development Team',
            can_approve=True
        )
        
        self.assertEqual(profile.user, self.manager_user)
        self.assertEqual(profile.team, 'Development Team')
        self.assertTrue(profile.can_approve)

    def test_manager_profile_str_representation(self):
        """Test string representation of manager profile"""
        profile = ManagerProfile.objects.create(
            user=self.manager_user,
            team='Development Team'
        )
        expected = f"{self.manager_user.username} - Manager"
        self.assertEqual(str(profile), expected)

    def test_manager_profile_one_to_one(self):
        """Test one-to-one relationship with user"""
        profile = ManagerProfile.objects.create(user=self.manager_user)
        
        # Test reverse relationship
        self.assertEqual(self.manager_user.manager_profile, profile)


class MemberProfileModelTest(TestCase):
    """Test cases for MemberProfile model"""

    def setUp(self):
        """Set up test data"""
        self.member_user = User.objects.create_user(
            username='member',
            email='member@example.com',
            password='memberpass123',
            role=User.Role.MEMBER
        )

    def test_create_member_profile(self):
        """Test creating member profile"""
        hire_date = date(2023, 1, 15)
        profile = MemberProfile.objects.create(
            user=self.member_user,
            position='Developer',
            skills=['Python', 'JavaScript', 'React'],
            hire_date=hire_date
        )
        
        self.assertEqual(profile.user, self.member_user)
        self.assertEqual(profile.position, 'Developer')
        self.assertEqual(profile.skills, ['Python', 'JavaScript', 'React'])
        self.assertEqual(profile.hire_date, hire_date)

    def test_member_profile_str_representation(self):
        """Test string representation of member profile"""
        profile = MemberProfile.objects.create(
            user=self.member_user,
            position='Developer'
        )
        expected = f"{self.member_user.username} - Team Member"
        self.assertEqual(str(profile), expected)

    def test_member_profile_one_to_one(self):
        """Test one-to-one relationship with user"""
        profile = MemberProfile.objects.create(user=self.member_user)
        
        # Test reverse relationship
        self.assertEqual(self.member_user.member_profile, profile)

    def test_member_profile_json_fields(self):
        """Test JSON field handling"""
        profile = MemberProfile.objects.create(
            user=self.member_user,
            skills=['Python', 'Django', 'PostgreSQL']
        )
        
        # Test skills list
        expected_skills = ['Python', 'Django', 'PostgreSQL']
        self.assertEqual(profile.skills, expected_skills)
        
        # Test updating skills
        profile.skills.append('React')
        profile.save()
        
        updated_profile = MemberProfile.objects.get(pk=profile.pk)
        self.assertIn('React', updated_profile.skills)


class UserProfileIntegrationTest(TestCase):
    """Integration tests for user profiles"""

    def setUp(self):
        """Set up test data"""
        # Use unique usernames to avoid conflicts
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

    def test_multiple_profile_types(self):
        """Test that users can have different profile types"""
        admin_profile = AdminProfile.objects.create(
            user=self.admin_user,
            department='IT'
        )
        manager_profile = ManagerProfile.objects.create(
            user=self.manager_user,
            team='Development'
        )
        member_profile = MemberProfile.objects.create(
            user=self.member_user,
            position='Developer'
        )
        
        # Test that each user has the correct profile
        self.assertEqual(self.admin_user.admin_profile, admin_profile)
        self.assertEqual(self.manager_user.manager_profile, manager_profile)
        self.assertEqual(self.member_user.member_profile, member_profile)
        
        # Test that users don't have other profile types
        with self.assertRaises(hasattr(self.admin_user, 'manager_profile') and 
                              self.admin_user.manager_profile.DoesNotExist if hasattr(self.admin_user, 'manager_profile') else Exception):
            _ = self.admin_user.manager_profile

    def test_profile_creation_timestamps(self):
        """Test that timestamps are properly set"""
        admin_profile = AdminProfile.objects.create(user=self.admin_user)
        manager_profile = ManagerProfile.objects.create(user=self.manager_user)
        member_profile = MemberProfile.objects.create(user=self.member_user)
        
        # Test created_at is set
        self.assertIsNotNone(admin_profile.created_at)
        self.assertIsNotNone(manager_profile.created_at)
        self.assertIsNotNone(member_profile.created_at)
        
        # Test updated_at is set initially
        self.assertIsNotNone(admin_profile.updated_at)
        self.assertIsNotNone(manager_profile.updated_at)
        self.assertIsNotNone(member_profile.updated_at)
        
        # Test that updated_at changes when we update
        original_updated = admin_profile.updated_at
        admin_profile.department = 'Updated Department'
        admin_profile.save()
        
        self.assertNotEqual(admin_profile.updated_at, original_updated)
        self.assertGreater(admin_profile.updated_at, original_updated)
