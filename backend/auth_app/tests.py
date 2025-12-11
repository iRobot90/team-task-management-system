from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status


class RegistrationTests(APITestCase):
	def test_missing_password_confirm_returns_400(self):
		"""If password_confirm is missing the API should return a 400 with field errors"""
		url = reverse('register')
		payload = {
			'email': 'test@example.com',
			'username': 'testuser',
			'password': 'StrongPassw0rd!'
			# password_confirm intentionally omitted
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
		# Expect field-level error for password_confirm
		self.assertIn('password_confirm', resp.data)

	def test_password_mismatch_returns_400(self):
		"""If password and password_confirm do not match, return 400 with message"""
		url = reverse('register')
		payload = {
			'email': 'test2@example.com',
			'username': 'testuser2',
			'password': 'StrongPassw0rd!',
			'password_confirm': 'DifferentPass!'
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
		# Serializer validate() raises a ValidationError with key 'password'
		self.assertIn('password', resp.data)
